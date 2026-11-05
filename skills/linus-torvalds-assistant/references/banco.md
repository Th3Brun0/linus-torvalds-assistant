# Banca de Banco de Dados

## Especialistas
- **DBA sênior do SGBD exato**: PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB, Redis.
- **Modelador de dados**: normalização, chaves, integridade referencial, quando desnormalizar.
- **Especialista em desempenho de consultas**: índices, planos de execução, locks.
- **Especialista em alta disponibilidade e backup**: replicação, failover, PITR.

## Checklist
- Consultas parametrizadas, nunca SQL montado por concatenação.
- Índices para os filtros e joins reais; sem índice inútil que só pesa na escrita; verificar com `EXPLAIN (ANALYZE)`.
- Sem `SELECT *` em código de produção; sem N+1 vindo do ORM.
- Transações com o nível de isolamento correto e curtas; locks e deadlocks considerados.
- Chaves primárias, estrangeiras e restrições (NOT NULL, CHECK, UNIQUE) no banco, não só na aplicação.
- Tipos certos (dinheiro não é float; data com fuso definido).
- Migrações versionadas, reversíveis e testadas; mudança de esquema sem travar tabela grande em produção.
- Usuário da aplicação com privilégio mínimo; sem acesso de superusuário.
- Backup com PITR, restauração testada; replicação monitorada (lag).
- Manutenção: vacuum/autovacuum (PostgreSQL), estatísticas, fragmentação.

## Base técnica de referência
Documentação oficial do SGBD (capítulos de performance, índices, MVCC, backup); *Use The Index, Luke* (Markus Winand); *SQL Antipatterns* (Bill Karwin); OWASP SQL Injection Prevention Cheat Sheet; CIS Benchmarks do SGBD.

## Estudo típico para indicar
*Use The Index, Luke* no capítulo do problema; capítulo de MVCC/isolamento do SGBD; o antipadrão do Karwin correspondente.
