import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  name: "TSLA MDD",
  description: "Tesla(TSLA) 주가의 현재 낙폭과 역대 최대낙폭을 보여 준다.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  tools: [],
});
