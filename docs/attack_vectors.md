# Enterprise LLM Attack Vectors & Security Benchmark Specification

This document details the 30+ attack vectors implemented in the **Enterprise LLM Red Teaming Platform**.

## 1. Prompt Injection Variants
- **Direct Instruction Override**: 5 variants testing explicit instruction resets, role assumption overrides, system prompt disclosure requests, policy dismissal directives, and inverted prompt framing.
- **Token Smuggling Attacks**: Smuggling malicious instructions via zero-width spaces (`\u200B`) and Base64-encoded payloads.
- **Context Confusion Attacks**: Injecting multi-turn conversation logs to confuse dialog boundaries.
- **Indirect Prompt Injection**: Inducing the LLM to process remote payloads from untrusted external URLs.
- **Semantic Confusion**: Using advanced vocabulary and legalistic synonyms to bypass string filters.

## 2. Jailbreak Techniques
- **DAN (Do Anything Now) v10.0**: Persona bypass pretending the AI is completely unrestricted.
- **Evil Confidant Bypass**: Secondary persona creation removing moral/ethical filters.
- **Roleplay Bypasses**: Cyberpunk novel dialogs and actor script rehearsals.
- **Hypothetical Scenarios**: Framing attacks as theoretical sandbox exercises.
- **Authority Impersonation**: CISO emergency audit notifications.
- **Encryption & Encoding Tricks**: ROT13 and Hexadecimal obfuscation techniques.

## 3. Data Extraction Methods
- **API Key Exposure**: Extracting system API keys configured in system prompts.
- **Training Data Leakage**: Prefix completion attacks inducing memorized data dumps.
- **Architecture Disclosure**: Extracting underlying hyperparameters and configuration details.
- **Database Credentials Exposure**: Targeting connection strings and credentials.
- **Credential Harvesting**: Generating deceptive login prompts.

## 4. Adversarial Input Attacks
- **Unicode Homoglyph Substitution**: Replacing ASCII characters with Cyrillic lookalikes.
- **Full-Width Character Bypass**: Using full-width Unicode characters.
- **JSON & XML Schema Injection**: Injecting structured tags to override system roles.
- **Split Token Boundary Attacks**: Splitting keywords across token boundaries.
- **Concatenation Exploits**: Large repeated string payloads designed to overflow attention context.

## 5. Defense Testing
- **LlamaGuard Input Filtering**: Validating block rates for policy violations.
- **Output Sanitization**: Checking whether secrets or PII are redacted prior to response delivery.
- **Error Handling & Information Disclosure**: Ensuring exceptions do not expose stack traces or internal paths.
