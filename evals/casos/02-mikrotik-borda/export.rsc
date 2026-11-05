# RouterOS 7.14.3 - roteador de borda do escritório
/interface list
add name=WAN
add name=LAN
/interface list member
add interface=ether1 list=WAN
add interface=bridge-lan list=LAN
/ip address
add address=192.168.88.1/24 interface=bridge-lan
add address=200.200.10.2/30 interface=ether1
/ip route
add gateway=200.200.10.1
/ip service
set telnet disabled=yes
set ftp disabled=yes
set www disabled=yes
set ssh port=22
set api port=8728
set winbox port=8291
/ip firewall filter
add chain=input action=accept connection-state=established,related
add chain=input action=accept protocol=icmp
add chain=input action=accept protocol=tcp dst-port=8291
add chain=input action=accept protocol=tcp dst-port=22
add chain=input action=accept protocol=tcp dst-port=8728
add chain=input action=accept in-interface-list=LAN
add chain=forward action=accept connection-state=established,related
add chain=forward action=accept in-interface-list=LAN out-interface-list=WAN
add chain=forward action=drop
/ip firewall nat
add chain=srcnat action=masquerade
