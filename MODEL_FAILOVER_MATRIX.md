# AI Model Failover & Allocation Matrix

Chi tiết quy tắc phân bổ mô hình AI theo từng bước thực thi và chuỗi tự động chuyển đổi (Failover Chain) khi xảy ra sự cố API / hết Token / Rate-limit.

---

## 🔀 CHUỖI PHÂN BỔ & PHÒNG BẰNG DỰ PHÒNG TỰ ĐỘNG (FAILOVER CHAINS)

```
[STEP 1] Governance & Arch
  ├── Primary:     cu/claude-opus-4-8-thinking-max (Extreme Reasoning)
  ├── Fallback 1:  cx/gpt-5.6-sol-ultra
  ├── Fallback 2:  tllm/CLAUDE_4_6_OPUS
  └── Emergency:   auto/pro-reasoning

[STEP 2] Data ETL & Prisma Seeding
  ├── Primary:     kimi-coding/kimi-for-coding-highspeed (Highspeed Precise Code)
  ├── Fallback 1:  cu/gpt-5.3-codex-spark-preview-xhigh
  ├── Fallback 2:  huggingchat/deepseek-ai/DeepSeek-V4-Pro
  └── Emergency:   auto/best-coding

[STEP 3] Backend API & Security Polish
  ├── Primary:     cx/gpt-5.6-terra-ultra (High Speed API & Security)
  ├── Fallback 1:  tllm/CLAUDE_4_6_SONNET
  ├── Fallback 2:  kr/claude-sonnet-5-xhigh
  └── Emergency:   auto/pro-coding

[STEP 4] Frontend Next.js UI/UX Refinement
  ├── Primary:     cu/composer-2.5 (Fullstack UI Specialist)
  ├── Fallback 1:  cu/claude-sonnet-5-thinking-max
  ├── Fallback 2:  aug/sonnet5-high
  └── Emergency:   auto/pro-chat

[STEP 5] E2E Visual QA & Live Audit
  ├── Primary:     gemini/gemini-3.1-pro-preview (Multimodal Vision)
  ├── Fallback 1:  antigravity/gemini-3.6-flash-high
  ├── Fallback 2:  auto/best-vision
  └── Emergency:   auto/pro-vision
```

---

## 🛠️ QUY TẮC CHUYỂN ĐỔI DỰ PHÒNG (FAILOVER EXECUTION RULES)

1. **Auto-Retry & Seamless Fallback**: Khi Model Primary gặp sự cố (HTTP 429 Rate Limit, HTTP 500/503 Server Error, hết Token, hoặc Timeout), hệ thống tự động nhảy sang Fallback 1 -> Fallback 2 -> Emergency mà không ngắt quãng tiến trình.
2. **Context Retention**: Toàn bộ prompt, mã nguồn và dữ liệu ngữ cảnh (Context) được bảo lưu nguyên vẹn khi chuyển giao model.
3. **Log Notification**: Ghi lại log ngắn gọn khi kích hoạt dự phòng để dễ dàng theo dõi hiệu năng của từng provider.
