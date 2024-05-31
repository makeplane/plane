

function printSuccess {
cat <<"EOF"
 ____                              
/ ___| _   _  ___ ___ ___  ___ ___ 
\___ \| | | |/ __/ __/ _ \/ __/ __|
 ___) | |_| | (_| (_|  __/\__ \__ \
|____/ \__,_|\___\___\___||___/___/

EOF
}
function printFailed {
cat <<"EOF"
 _____     _ _          _ 
|  ___|_ _(_) | ___  __| |
| |_ / _` | | |/ _ \/ _` |
|  _| (_| | | |  __/ (_| |
|_|  \__,_|_|_|\___|\__,_|

EOF
}



helm template plane-ce-app-$(date +%s) helm-chart -n myns > test-helm-chart.yaml
if [ $? -eq 0 ]; then
    clear
    printSuccess
    code test-helm-chart.yaml
else
    printFailed
fi
