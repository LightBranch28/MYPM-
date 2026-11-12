{
  "installCommand": "echo no install needed",
  "buildCommand": "rm -rf site && mkdir site && (unzip -oq fashionos-site-ready.zip -d site || python3 -m zipfile -e fashionos-site-ready.zip site)",
  "outputDirectory": "site"
}
