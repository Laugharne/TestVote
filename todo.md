
```bash
#!/bin/bash
set -e  # Exit on First Error

TERMINAL=konsole
IDE=code

echo "🚀 Launch Ganache"
konsole --new-tab -e ganache& > /dev/null

echo "🛠️ Truffle"
truffle version
truffle init
tree -a

echo "🛠️ Copy template"
cp -r TEMPLATE_PROJECT/.[^.]* .
tree -a
```
Copier **base**

```bash
echo "🛠️ Remove .gitkeep"
rm ./contracts/.gitkeep
rm ./migrations/.gitkeep
rm ./test/.gitkeep

echo "⚙️ Install HDWallet provider & dotenv capabilities"
npm install @truffle/hdwallet-provider
npm install --save dotenv

echo "⚙️ Install Open Zeppelin libraries"
npm install @openzeppelin/contracts --save
npm install @openzeppelin/test-helpers --save

echo "👉 See Solidity compiler version in sources..."
grep "pragma solidity" ./contracts/SimpleStorage.sol -A 3 -B 3
echo
grep "solc" truffle-config.js -A 3 -B 3
echo
sleep 1

echo "🚀 1st deployment"
truffle deploy

echo "⚙️ Git initialization"
git init
touch README.md
git add .
git branch -M main
git commit -m "1st commit"

echo "🚀 Launch IDE"
code .
```

