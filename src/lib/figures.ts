import { defineHastPlugin } from "satteri"

export const figures = defineHastPlugin({
  name: "figures",
  element: {
    filter: ["p"],
    visit(paragraph, ctx) {
      const content = paragraph.children.filter((child) => child.type !== "text" || child.value.trim() !== "")
      const [image] = content
      if (content.length !== 1 || image?.type !== "element" || image.tagName !== "img") return
      const { title, ...properties } = image.properties
      const caption =
        typeof title === "string" && title.trim() !== ""
          ? [{ type: "element" as const, tagName: "figcaption", properties: {}, children: [{ type: "text" as const, value: title }] }]
          : []
      ctx.replaceNode(paragraph, {
        type: "element",
        tagName: "figure",
        properties: {},
        children: [{ ...image, properties }, ...caption],
      })
    },
  },
})
