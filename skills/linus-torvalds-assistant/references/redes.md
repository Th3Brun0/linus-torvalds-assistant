# Banca de Redes

## Especialistas (escolha os que se aplicam)
- **Engenheiro de redes sênior — roteamento** (CCNP/CCIE Enterprise, MTCRE/MTCINE): tabelas de roteamento, OSPF, BGP, policy routing, VRF.
- **Engenheiro de redes sênior — switching/camada 2**: VLANs 802.1Q, STP/RSTP/MSTP, LACP 802.3ad, loops, broadcast storm.
- **Especialista em firewall e segurança de perímetro**: chains, connection tracking, NAT, ordem de regras, princípio do menor privilégio.
- **Engenheiro de provedor/ISP (telecom)**: CGNAT (RFC 6598, 100.64.0.0/10), PPPoE, BGP com operadoras, IPv6 dual-stack, QoS e filas.
- **Especialista em IPv6**: SLAAC, DHCPv6-PD, ICMPv6 obrigatório.
- **Especialista do fabricante** quando houver: MikroTik RouterOS, Cisco IOS/IOS-XE, Fortinet FortiOS, pfSense/OPNsense, Huawei VRP, Linux nftables/iptables.

## Checklist
**Firewall**
- Ordem: `established,related` aceito primeiro, `invalid` derrubado cedo, `drop` no fim de cada chain.
- `input` (para o próprio equipamento) e `forward` (através dele) tratados separadamente; gerência (Winbox, SSH, API, SNMP) acessível só de rede de gerência.
- Nenhum serviço de gerência exposto na WAN (API 8728, Winbox 8291, Telnet, HTTP sem TLS).
- ICMP/ICMPv6 não bloqueado às cegas (PMTUD quebra; RFC 4890 para ICMPv6).
- Fasttrack/offload não pulando regras que precisam ver o tráfego (mangle, queues, IPsec).
- NAT: srcnat/masquerade só na interface de saída certa; dstnat com regra de filter correspondente; hairpin NAT quando preciso.
- Address-lists para bogons/RFC 1918 vindos da WAN (anti-spoofing, BCP 38/RFC 2827).

**Roteamento**
- Rotas estáticas com distância/recursão corretas, check-gateway em failover.
- OSPF: áreas, autenticação, interfaces passivas nas LANs.
- BGP: filtros de prefixo de entrada e saída (nunca anunciar full table nem receber sem filtro), max-prefix, RPKI/ROV, MANRS.

**Camada 2**
- VLAN nativa ≠ VLAN de gerência; portas de acesso vs trunk definidas; bridge VLAN filtering ligado de fato (RouterOS).
- STP ligado com root bridge escolhido, BPDU guard em portas de acesso.

**Desempenho e capacidade**
- Regras que forçam processamento em CPU desnecessário (mangle em todo pacote, layer7, regex).
- Filas/QoS: tipo de fila adequado (fq_codel/cake para bufferbloat), limites coerentes.

## Base técnica de referência
RFC 1918, RFC 6598, RFC 2827/BCP 38, RFC 4890, RFC 7454 (BGP operations), RFC 8200 (IPv6), RFC 791/793; MikroTik Packet Flow e Firewall docs (help.mikrotik.com); Cisco SAFE; CIS Benchmarks de equipamentos de rede; MANRS.

## Estudo típico para indicar
Packet Flow do RouterOS; chains input/forward/output e connection tracking; BCP 38; RFC 4890; operação de BGP (RFC 7454).
