# Banca de Código

## Especialistas
- **Analista sênior da linguagem exata** (sempre um por linguagem presente; ex.: Python, Go, Rust, Java/Kotlin, C#/.NET, JavaScript/TypeScript/Node, PHP, C/C++, Bash/Shell, PowerShell, SQL).
- **Arquiteto de software** (ver `arquitetura.md`) quando o trecho define estrutura, módulos ou APIs.
- **Engenheiro de qualidade/testes**: cobertura do que importa, testes que testam comportamento e não implementação.
- **AppSec** (ver `seguranca.md`) quando há entrada externa, credencial, SQL, shell ou rede.
- **Engenheiro de desempenho** quando o código roda em laço quente, volume alto ou latência importa.

## Checklist geral
- Correção: casos de borda, nulos, vazios, overflow, fuso horário, encoding, concorrência (race, deadlock).
- Tratamento de erro: nada engolido em silêncio; erro com contexto; falha alta e cedo.
- Recursos: arquivos, conexões, locks e goroutines/threads sempre liberados.
- Complexidade: algoritmo adequado ao volume (O(n²) escondido, N+1 em banco).
- Legibilidade: nomes, funções pequenas, sem duplicação, sem "comentário que pede desculpas".
- Testes existem para o caminho crítico e para o bug corrigido.
- Dependências: versões fixadas, nada abandonado ou com CVE conhecido.
- Segredos fora do código e fora do repositório.

## Por linguagem (o analista sênior cobra)
- **Bash/Shell**: `set -euo pipefail`; variáveis sempre entre aspas; `[[ ]]`; sem parsing de `ls`; `mktemp` para temporários; `trap` para limpeza; ShellCheck sem avisos.
- **PowerShell**: `Set-StrictMode`, `-ErrorAction Stop`, `try/catch`, sem `Invoke-Expression` com entrada externa, PSScriptAnalyzer.
- **Python**: tipagem (mypy/pyright), sem `except:` nu, context managers, sem mutável como default, `subprocess` sem `shell=True` com entrada externa, ruff.
- **Go**: erros checados e com `%w`, `context` propagado, nada de goroutine órfã, `go vet`/staticcheck, `-race` nos testes.
- **Rust**: sem `unwrap()` em caminho de produção, `unsafe` justificado, clippy.
- **JavaScript/TypeScript**: `strict` ligado, sem `any` solto, promises sempre aguardadas ou tratadas, validação de entrada (zod etc.), ESLint.
- **Java/Kotlin/C#**: recursos com try-with-resources/using, nulabilidade, exceções específicas, injeção de dependência sem acoplamento escondido.
- **PHP**: PDO com prepared statements, `declare(strict_types=1)`, PSR-12, sem `eval`.
- **C/C++**: limites de buffer, ownership claro (RAII em C++), sanitizers (ASan/UBSan), sem comportamento indefinido.
- **SQL**: ver `banco.md`.

## Base técnica de referência
Guias oficiais da linguagem (PEP 8/PEP 20, Effective Go, Rust API Guidelines, Google Shell Style Guide), ShellCheck wiki, SEI CERT Coding Standards, OWASP ASVS, CWE Top 25, *Clean Code* e *Refactoring* (Fowler).

## Estudo típico para indicar
Documentação oficial da linguagem no tópico do erro; ShellCheck wiki do código do aviso; CWE específica; capítulo do *Refactoring* do code smell encontrado.
