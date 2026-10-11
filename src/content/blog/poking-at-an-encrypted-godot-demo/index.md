---
title: "poking at an encrypted godot demo"
description: "where godot keeps the pck key, and how i found it while learning reverse engineering"
date: 2026-10-11
draft: false
---

i've been trying to get into reverse engineering for a while, and reading other people's writeups only gets you so far. at some point you have to open a binary yourself and get lost in it.

so i picked a target: a free godot demo on steam. its game data was encrypted, which sounded like a nice small puzzle, and godot is open source, so whenever i got stuck i could go read the engine instead of guessing.

this post is about how the key ended up sitting in the exe, how i found it, and how i checked that it was the right one. i'm not naming the game, and there's no key, no addresses from that build, and no extracted files in here. the point is the process, not this particular demo. the code below is shortened and uses symbolic names where the original analysis had build-specific values.

## what's in a godot build

a godot game on windows often ships with an `.exe` and a `.pck` next to it. the pack can also be embedded in the executable, and there may be additional libraries alongside them.

the exe contains the engine runtime: the renderer, resource loading, scripting support, and so on. depending on the project, it can also contain custom native code. the pck is a container for the exported project: scenes, scripts, textures, sounds, settings. a lot of that can be converted on export, so a text scene might become a binary one and a png might become an imported texture. it contains what was shipped, which is not necessarily everything in the original project folder.

the standard pck header is readable even when the directory and file contents are encrypted. it gives you the pack format and engine version. in the format i was looking at, it also points to the file directory. the file count is stored at that directory location, immediately before its encrypted contents; it isn't a field in the fixed header itself. the engine's [pack reader](https://github.com/godotengine/godot/blob/master/core/io/file_access_pack.cpp) is useful for checking these details against a particular format version.

this was a format v4 pack from a recent godot 4 release, with a few thousand files. the directory — paths, sizes, offsets, flags — and the file contents were encrypted. gdre couldn't recover the project without the key.

## the key has to be somewhere

this is the part that made everything click for me.

godot's [standard pck encryption](https://docs.godotengine.org/en/4.0/contributing/development/compiling/compiling_with_script_encryption_key.html) works like this: the developer compiles an export template with an AES-256 key baked in, and the exporter encrypts the pack with that same key. when the game starts, the engine needs to read its own data, so it uses the key included in the executable.

the player receives the encrypted data and a program capable of decrypting it. the documentation actually says that the key needs to be stored in the binary. finding it can take some work, but the scheme doesn't depend on the key being absent from the player's machine.

i didn't need to brute-force AES. i needed to follow the code that opens the encrypted pack and see where it gets its key.

that's specific to this standard setup. it doesn't mean every game has a conveniently labelled secret waiting in its executable.

## finding it

i started with a string:

```text
Can't open encrypted pack directory.
```

it's an engine error message. the useful thing about it is its location in the loading path: a reference to that message gives you somewhere sensible to start reading the surrounding code.

my first script read the exe as a PE file and recorded its section table. `.text` held the machine code; `.rdata` and `.data` held data. it then found the error string and scanned the code section for references to it.

on x64, one common way to take a nearby address is a `LEA` instruction using RIP-relative addressing. the displacement is relative to the *next* instruction, not the beginning of the current one. for the seven-byte form i was looking for, the calculation was:

```python
import struct


def lea_target_rva(
    executable: bytes, offset: int, instruction_rva: int
) -> int | None:
    if offset < 0 or offset + 7 > len(executable) or instruction_rva < 0:
        return None

    rex, opcode, modrm = executable[offset : offset + 3]
    if (rex & 0xF8) != 0x48 or opcode != 0x8D:
        return None
    if (modrm & 0xC7) != 0x05:
        return None

    displacement = struct.unpack_from("<i", executable, offset + 3)[0]
    return instruction_rva + 7 + displacement
```

the scanner compared that result with the string's RVA, its address relative to the image base. this was a small pattern scanner, not an instruction decoder. matching bytes can occur inside other instructions, so i still needed to inspect the hits in a disassembler.

that was the manual part. the script found places to look; it didn't automatically identify the key.

i used `objdump` to read the surrounding instructions. further along the same loading path, the code allocated a 32-byte buffer and copied two adjacent 16-byte blocks into it. with the real addresses and unrelated instructions removed, the interesting part looked like this:

```asm
; schematic excerpt: key_data is an explanatory label, not a recovered symbol
movups xmm0, [rip + key_data]
movups [rax], xmm0
movups xmm1, [rip + key_data_plus_16]
movups [rax + 16], xmm1
```

`MOVUPS` moves 128 bits, or 16 bytes. despite its floating-point name, it can be used to copy raw bytes. here the two loads supplied 32 bytes to the buffer used by the encrypted-file reader.

two `MOVUPS` loads on their own don't prove you've found an AES key. it was the surrounding allocation, copy, and decryption call that made this a good candidate. the next step was to test it.

first, i had to turn the address shown by the disassembler into a position in the exe file. those are different coordinate systems. using the preferred image base and section table from the PE header:

```python
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class Section:
    rva: int
    offset: int
    size: int


def va_to_file_offset(
    virtual_address: int, image_base: int, sections: Sequence[Section]
) -> int:
    rva = virtual_address - image_base
    if image_base < 0 or rva < 0:
        raise ValueError("invalid relative address")

    for section in sections:
        if min(section.rva, section.offset, section.size) < 0:
            raise ValueError("invalid section metadata")
        if section.rva <= rva and rva + 32 <= section.rva + section.size:
            return section.offset + rva - section.rva

    raise ValueError("candidate is outside file-backed data")
```

here `section.offset` and `section.size` describe the raw bytes in the file. the formula is just: subtract the section's relative virtual address, then add its raw file offset. i could then read the candidate's 32 bytes without launching the demo.

the address was specific to this build. it is deliberately absent from this post, and another build would require finding it again.

## is it the right key?

reading 32 bytes from the exe was only a hypothesis. the encrypted directory gave me a way to check it.

for this pack, after the directory's file count, the encrypted block had this layout:

```text
16 bytes    expected MD5 of the plaintext
 8 bytes    plaintext length, little-endian
16 bytes    initialization vector
...         ciphertext, stored at a length rounded up to 16 bytes
```

i checked the layout and cipher mode against godot's [encrypted-file reader](https://github.com/godotengine/godot/blob/master/core/io/file_access_encrypted.cpp). this block used AES-256-CFB. there was no extra encrypted-file magic value at this position because the pack reader opens it with that check disabled.

here's the verification step in Python, using `cryptography` for AES and the standard library for the checksum. the examples use Python 3.10 or newer; this version of the dependency provides the imports below:

```text
python -m pip install cryptography==50.0.2
```

CFB lives in `cryptography`'s [decrepit modes module](https://cryptography.io/en/stable/hazmat/decrepit/modes/). i'm using it to match the existing godot format. in this shortened example, `block` is the encrypted directory block after the file count, and `key` is the candidate as `bytes`:

```python
import hashlib
import hmac
import struct

from cryptography.hazmat.decrepit.ciphers.modes import CFB
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms


def decrypt_and_check_directory(block: bytes, key: bytes) -> bytes:
    if len(key) != 32 or len(block) < 40:
        raise ValueError("invalid key or encrypted block")

    length = struct.unpack_from("<Q", block, 16)[0]
    stored_length = ((length + 15) // 16) * 16
    if stored_length > len(block) - 40:
        raise ValueError("truncated encrypted block")

    expected_md5 = block[:16]
    iv = block[24:40]
    ciphertext = block[40 : 40 + stored_length]
    decryptor = Cipher(algorithms.AES(key), CFB(iv)).decryptor()
    plaintext = (decryptor.update(ciphertext) + decryptor.finalize())[:length]

    actual_md5 = hashlib.md5(plaintext, usedforsecurity=False).digest()
    if not hmac.compare_digest(actual_md5, expected_md5):
        raise ValueError("directory checksum mismatch")
    return plaintext
```

the 16-byte rounding follows godot's storage layout here; it isn't a requirement that CFB only encrypt whole blocks. the stored plaintext length tells the reader where to trim the decrypted bytes.

the checksum matched. the result also parsed as the expected directory, with sensible paths and sizes. that was the evidence i needed: this candidate could decrypt the pack.

MD5 here is a format checksum, not modern authenticated encryption. it was useful for checking my candidate against this file; it doesn't establish that a package is trustworthy or protected against deliberate modification.

## letting gdre do the rest

once the key was verified, i handed the pack to [GDRE Tools](https://github.com/GDRETools/gdsdecomp).

this is where most of the recovery work happened. gdre already knows how to unpack supported godot builds, decompile their GDScript, convert resources, and reconstruct project configuration. my scripts found and checked the missing input; they didn't implement a replacement for gdre.

i used a small wrapper to read the key from a local file and pass it to the tool. it also checked directory paths for obvious traversal, refused to overwrite the output folder, and captured the recovery log. i'm leaving out the build-specific invocation and generated files.

gdre extracted the pack and decompiled the standalone scripts successfully. resource conversion was less exact: some models were recovered in a different format, some import metadata needed attention, and one scene had unresolved dependencies. those are separate outcomes from whether the key works.

the recovery ran headless. gdre's report also warned that scene export can be limited in that mode, which mattered when interpreting the resource warnings.

## decrypt, extract, decompile

i kept using these words interchangeably at first, but they describe different steps.

**decrypt** means turn ciphertext back into plaintext bytes using the key. you might end up with a perfectly valid binary scene that still isn't editable as text.

**extract** means read the container's directory and write out its files. an extracted compiled script is still a compiled script.

**decompile** means reconstruct readable code from the representation shipped in the build. for the modern GDScript format involved here, the `.gdc` files contain tokenized script data, not the same kind of native machine code as the engine exe.

resource conversion is another job again. recovering a usable model doesn't recreate the original blender project, and recovering script text doesn't recreate comments or formatting that were omitted during export. files that were never shipped can't be recovered from the pack at all.

getting something the editor can open is already useful. getting the exact original repository back is a much bigger claim.

## it opened, but didn't run

the project opened, but loading into the game stopped on a script type error.

one scene contained an empty built-in script attached to a 3D node. without an explicit base class, GDScript defaulted to `RefCounted`, which couldn't be assigned to that node. the scene needed a one-line base-class correction, and the reported loading problem went away.

the useful lesson was how little the earlier success messages told me about this. all the standalone scripts had decompiled, but that didn't validate every script attachment inside every scene.

i didn't establish why that embedded script was empty, so i'm not calling it a confirmed gdre bug. i could verify the mismatch and the correction. that was enough to explain this particular failure, not to certify every level and mechanic.

## will this work on any godot game?

the most promising case is a standard godot build using a supported GDScript format. if its pack isn't encrypted, the key-search part disappears. if it uses the standard encryption setup and the matching executable is available, the approach here may apply.

there are several ways another godot project can be different:

- **C# logic.** managed assemblies require their own analysis. if that code was compiled to native machine code, recovering readable source becomes a different problem again.
- **GDExtension or custom engine modules.** extracting a native library doesn't recover its C++ source. a project can depend on substantial logic outside GDScript.
- **a modified engine.** a developer can change the pack format, script representation, cipher, or key handling. the standard readers and this instruction pattern may no longer fit. gdre documents [custom decryptors](https://github.com/GDRETools/gdsdecomp/blob/master/docs/custom_decryptors.md), but implementing one first requires understanding the actual scheme.
- **another platform or architecture.** the scanner here assumed a Windows x64 PE executable. an Android library, Linux binary, or WebAssembly module needs a different analysis.
- **an incomplete build.** an encrypted pack without its key or a usable way to recover it is a very different starting point. knowing the container format doesn't make brute-forcing a random AES-256 key practical.

even when code recovery goes well, original asset files and unshipped server logic remain outside what the client build can give you.

so i'd reuse the questions before reusing the scripts: which godot version, which platform, which language, which pack format, and which encryption path? the answer determines how much of this process carries over.

## conclusion + thanks

what i took away from this was how much a small clue can narrow the work. an error string led to code references; those led to a candidate buffer; the directory checksum gave me a concrete way to test it. reading the engine source made each step easier to check.

the manual address lookup mattered. so did letting an existing recovery tool handle the formats it already understood. there's no universal key finder hidden in the few scripts i wrote for this build.

thanks to the [gdsdecomp / GDRE Tools project](https://github.com/GDRETools/gdsdecomp) for doing the substantial work of project recovery, and to the [godot documentation](https://docs.godotengine.org/en/4.0/contributing/development/compiling/compiling_with_script_encryption_key.html) and engine source for making the encryption path inspectable.

for developers, the practical takeaway is to keep backups of the source project and the original assets. a shipped build may be enough to recover useful work, but it can't preserve information that never made it into the export.
