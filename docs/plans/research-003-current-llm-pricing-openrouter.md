# Current LLM Pricing Data - OpenRouter (October 2025)

**Data Source**: OpenRouter API (https://openrouter.ai/api/v1/models)
**Date Retrieved**: 2025-10-17
**Currency**: USD per token

## Top Coding LLMs - Pricing Summary

| Model | Input $/M Tokens | Output $/M Tokens | Context Length | Best For |
|-------|------------------|-------------------|----------------|----------|
| **Claude Sonnet 4.5** | $3.00 | $15.00 | 1M | Complex architecture, high-quality code |
| **GLM 4.6** | $0.50 | $1.75 | 202K | Full-stack development, API integration |
| **GLM 4.5 Air** | $0.14 | $0.86 | 131K | Rapid prototyping, cost-effective |
| **GPT-5** | $1.25 | $10.00 | 400K | Advanced reasoning, complex tasks |
| **GPT-5 Pro** | $15.00 | $120.00 | 400K | Premium quality, enterprise tasks |
| **Gemini 2.5 Pro** | $1.25 | $10.00 | 1M | Large context, multimodal tasks |
| **Qwen3 Coder Plus** | $1.00 | $5.00 | 128K | Specialized coding, competitive |
| **Qwen3 Coder** | $0.22 | $0.95 | 262K | Budget-friendly coding |

## Detailed Pricing Breakdown

### Premium Models (High Quality)

**Claude Sonnet 4.5** (`anthropic/claude-sonnet-4.5`)
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Context: 1,000,000 tokens
- **Use Case**: Complex system architecture, documentation, high-stakes development

**GPT-5 Pro** (`openai/gpt-5-pro`)
- Input: $15.00 / 1M tokens
- Output: $120.00 / 1M tokens
- Context: 400,000 tokens
- **Use Case**: Premium enterprise applications, maximum quality requirements

**Gemini 2.5 Pro** (`google/gemini-2.5-pro`)
- Input: $1.25 / 1M tokens
- Output: $10.00 / 1M tokens
- Context: 1,048,576 tokens
- **Use Case**: Large context processing, multimodal development

### Balanced Models (Quality + Cost)

**GLM 4.6** (`z-ai/glm-4.6`)
- Input: $0.50 / 1M tokens
- Output: $1.75 / 1M tokens
- Context: 202,752 tokens
- **Use Case**: Full-stack development, API integration, balanced quality/cost

**GPT-5** (`openai/gpt-5`)
- Input: $1.25 / 1M tokens
- Output: $10.00 / 1M tokens
- Context: 400,000 tokens
- **Use Case**: Advanced coding tasks, complex problem solving

**Qwen3 Coder Plus** (`qwen/qwen3-coder-plus`)
- Input: $1.00 / 1M tokens
- Output: $5.00 / 1M tokens
- Context: 128,000 tokens
- **Use Case**: Specialized coding tasks, competitive performance

### Budget-Friendly Models (Speed + Cost)

**GLM 4.5 Air** (`z-ai/glm-4.5-air`)
- Input: $0.14 / 1M tokens
- Output: $0.86 / 1M tokens
- Context: 131,072 tokens
- **Use Case**: Rapid prototyping, simple tasks, cost-sensitive projects

**Qwen3 Coder** (`qwen/qwen3-coder`)
- Input: $0.22 / 1M tokens
- Output: $0.95 / 1M tokens
- Context: 262,144 tokens
- **Use Case**: Budget-conscious development, good performance

**Gemini 2.5 Flash Lite** (`google/gemini-2.5-flash-lite`)
- Input: $0.10 / 1M tokens
- Output: $0.40 / 1M tokens
- Context: 1,048,576 tokens
- **Use Case**: High-volume tasks, large context processing

### Ultra-Low Cost Models

**GLM 4 32B** (`z-ai/glm-4-32b`)
- Input: $0.10 / 1M tokens
- Output: $0.10 / 1M tokens
- Context: 128,000 tokens
- **Use Case**: Simple automation, basic coding tasks

**Qwen2.5 Coder 7B** (`qwen/qwen2.5-coder-7b-instruct`)
- Input: $0.03 / 1M tokens
- Output: $0.09 / 1M tokens
- Context: 32,768 tokens
- **Use Case**: Lightweight tasks, minimal complexity

## Free Tier Models

| Model | Context Length | Notes |
|-------|----------------|-------|
| GLM 4.5 Air (free) | 131K | Free tier available |
| Qwen3 Coder (free) | 262K | Free tier available |
| Qwen2.5 Coder 32B (free) | 32K | Free tier available |

## Cost Analysis for Development Tasks

### Example: Full-Stack Web Application (100K tokens total)

| Model | Input/Output Split | Estimated Cost |
|-------|-------------------|----------------|
| Claude Sonnet 4.5 | 60K input / 40K output | $1.80 |
| GLM 4.6 | 60K input / 40K output | $0.43 |
| GLM 4.5 Air | 60K input / 40K output | $0.17 |
| GPT-5 | 60K input / 40K output | $0.95 |
| Qwen3 Coder | 60K input / 40K output | $0.23 |

### Example: API Integration Project (50K tokens total)

| Model | Input/Output Split | Estimated Cost |
|-------|-------------------|----------------|
| Claude Sonnet 4.5 | 30K input / 20K output | $0.90 |
| GLM 4.6 | 30K input / 20K output | $0.22 |
| GLM 4.5 Air | 30K input / 20K output | $0.09 |
| GPT-5 | 30K input / 20K output | $0.48 |
| Qwen3 Coder | 30K input / 20K output | $0.12 |

## Recommendations for Agentic Development

### High-Quality Tasks (Architecture, Documentation)
- **Primary**: Claude Sonnet 4.5 ($3-15/M)
- **Alternative**: GPT-5 Pro ($15-120/M) for premium requirements

### Core Development (API, Backend, Frontend)
- **Primary**: GLM 4.6 ($0.50-1.75/M) - Best balance
- **Alternative**: GPT-5 ($1.25-10/M) for complex tasks

### Rapid Prototyping & Simple Tasks
- **Primary**: GLM 4.5 Air ($0.14-0.86/M) - Cost-effective
- **Alternative**: Qwen3 Coder ($0.22-0.95/M) - Good performance

### Budget-Constrained Development
- **Primary**: Qwen3 Coder ($0.22-0.95/M)
- **Alternative**: Gemini 2.5 Flash Lite ($0.10-0.40/M)

## Cost Optimization Strategies

1. **Model Selection**: Choose the right model for task complexity
2. **Prompt Optimization**: Minimize input tokens through efficient prompting
3. **Batch Processing**: Group similar tasks to reduce context switching
4. **Free Tier Usage**: Leverage free tiers for development and testing
5. **Hybrid Approach**: Use premium models for critical tasks, budget models for routine work

## Notes

- All prices are in USD per token
- Context length affects maximum conversation/turn capability
- Some models offer caching discounts (input_cache_read/write)
- Prices are subject to change based on OpenRouter pricing updates
- Actual costs may vary based on prompting efficiency and task complexity