#! /bin/bash

/usr/local/bin/python3 generate-charts-for-days-racing.py
/usr/local/bin/python3 daily-bet-report.py > /tmp/out-bet-temp.html
/usr/local/bin/wkhtmltopdf /tmp/out-bet-temp.html /tmp/bet-report.pdf
/usr/local/bin/python3 copy-bet-report.py
