# Banca de Infraestrutura e Servidores

## Especialistas
- **SysAdmin Linux sênior** (RHCE/LFCE): Ubuntu, Debian, RHEL/Rocky/Alma; systemd, permissões, SELinux/AppArmor, LVM, sistemas de arquivos.
- **Administrador Windows Server/AD sênior**: GPO, DNS/DHCP, AD tiering, Kerberos, contas de serviço.
- **SRE/DevOps sênior**: CI/CD, IaC (Terraform, Ansible), observabilidade, SLOs, runbooks.
- **Especialista em containers e orquestração**: Docker, Compose, Portainer, Kubernetes.
- **Especialista em virtualização e storage**: Proxmox, VMware, Hyper-V, Ceph, ZFS, RAID.
- **Especialista em backup e continuidade**: regra 3-2-1-1-0, RPO/RTO, testes de restauração.
- **Especialista em e-mail** quando couber: Postfix/iRedMail, Exchange/M365, SPF/DKIM/DMARC.

## Checklist
**Servidor**
- Atualizações automáticas de segurança; versão de SO ainda suportada.
- SSH: só chave, sem root direto, porta e origem restritas; fail2ban ou equivalente.
- Serviços: só o necessário escutando (`ss -tulpn`); cada serviço com usuário próprio sem privilégio.
- SELinux/AppArmor ligado, não desligado "porque dava erro".
- Logs centralizados e com retenção; NTP sincronizado.
- Disco: partições/LVM pensados, alerta antes de encher, `/var/log` não derruba o sistema.

**Containers**
- Imagem com versão fixada (nunca `latest` em produção), base mínima, scan de vulnerabilidade.
- Não roda como root; sem `--privileged`; sem montar `/var/run/docker.sock` sem motivo.
- Segredos via secrets/variáveis protegidas, nunca no Dockerfile ou no compose versionado.
- Healthcheck, limites de CPU/memória, restart policy, volumes para dado persistente.

**Operação**
- Mudança via IaC/Git, não na mão em produção.
- Monitoramento com alerta acionável (não só gráfico bonito).
- Backup testado com restauração real; cópia offline ou imutável contra ransomware.

## Base técnica de referência
CIS Benchmarks (Ubuntu, RHEL, Windows Server, Docker, Kubernetes); documentação Red Hat/Ubuntu Server; Google SRE Book; NIST SP 800-123 (segurança de servidores); NIST SP 800-190 (containers); RFC 7208 (SPF), RFC 6376 (DKIM), RFC 7489 (DMARC).

## Estudo típico para indicar
CIS Benchmark da distro, seção do item violado; capítulo do SRE Book (monitoramento, postmortem); systemd unit hardening (`systemd-analyze security`).
