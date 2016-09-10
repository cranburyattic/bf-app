#! /bin/bash

/usr/local/bin/python3 daily-market-report.py > /tmp/out-temp.html
/usr/local/bin/wkhtmltopdf /tmp/out-temp.html /tmp/market-report.pdf
/usr/local/bin/python3 copy-market-report.py
