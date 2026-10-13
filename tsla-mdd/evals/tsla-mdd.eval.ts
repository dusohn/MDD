import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke"],
  description: "Report Tesla maximum drawdown from the price tool.",
  async test(t) {
    await t.send("TSLA 최대낙폭 알려줘");
    t.succeeded();
    t.calledTool("get_tsla_mdd", {
      status: "completed",
      count: 1,
      output: { symbol: "TSLA" },
    });
    t.check(t.reply, includes(/TSLA|테슬라/));
    t.check(t.reply, includes(/%/));
  },
});
