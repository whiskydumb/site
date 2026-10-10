import { defineHastPlugin } from "satteri"

export const tableScroll = defineHastPlugin({
  name: "table-scroll",
  element: {
    filter: ["table"],
    visit(table, ctx) {
      ctx.wrapNode(table, { rawHtml: '<div class="table-scroll"></div>' })
    },
  },
})
