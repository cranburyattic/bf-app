#! /bin/bash

/usr/local/bin/python3 /Users/phirow/Development/git-repo/bf-app/python/generate-charts-for-days-racing.py
/usr/local/bin/python3 /Users/phirow/Development/git-repo/bf-app/python/daily-bet-report.py > /tmp/out-bet-temp.html
/usr/local/bin/wkhtmltopdf /tmp/out-bet-temp.html /tmp/bet-report.pdf
/usr/local/bin/python3 /Users/phirow/Development/git-repo/bf-app/python/copy-bet-report.py
