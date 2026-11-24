---
title: "Empirical Notes on KV-Cache Quantization at 64k Context Lengths"
date: "2025-12-03"
updated: null
description: "Benchmarking FP16, FP8, and INT4 per-channel KV-cache compression across long-context needle retrieval and structured code generation tasks."
categories:
  - Research & Experiments
tags:
  - Inference
  - Quantization
  - Benchmarks
  - LLM
draft: false
pinned: false
---

At 64k context lengths, autoregressive decoding is overwhelmingly **memory-bandwidth bound**. Even on high-bandwidth accelerators, streaming the Key-Value cache from HBM dominates per-token latency long before compute units saturate.

<!-- more -->

In this experiment, we measured memory footprint, decode throughput, and retrieval accuracy when quantizing KV tensors from FP16 down to FP8 (E4M3) and group-wise INT4.

## 1. Memory Bandwidth Equation

For a transformer with $L$ layers, $H_{kv}$ key-value heads, head dimension $d$, batch size $B$, and sequence length $N$, the KV cache footprint in bytes at $b$ bytes per element is:

$$
M_{\text{KV}} = 2 \cdot L \cdot H_{kv} \cdot d \cdot B \cdot N \cdot b
$$

Cutting $b$ from $2$ bytes (FP16) to $0.5$ bytes (INT4 plus group scales) yields nearly a $3.6\times$ reduction in HBM traffic per generated token.

## 2. Benchmark Summary

| Precision | Group Size | KV Footprint (64k) | Decode Throughput | Needle Retrieval |
| :--- | :--- | :--- | :--- | :--- |
| FP16 Baseline | — | 16.0 GB | 42 tok/s | 99.4% |
| FP8 (E4M3) | Per-tensor | 8.0 GB | 76 tok/s | 99.1% |
| INT4 (Keys Per-Channel) | 64 | 4.4 GB | 114 tok/s | 97.8% |
| INT4 (Naive Per-Token) | 64 | 4.4 GB | 118 tok/s | 88.2% |

:::warning{title="Key Outliers Matter"}
Key tensors exhibit strong channel-wise outlier magnitudes compared to Value tensors. Quantizing Keys **per-channel** while quantizing Values **per-token** preserves almost 10 percentage points of retrieval accuracy over naive symmetric INT4.
:::

## 3. Reproducibility Notes

All runs used greedy decoding (`temperature = 0`) over a fixed evaluation split of 200 long-context prompts mixing technical documentation and multi-file TypeScript repositories.
