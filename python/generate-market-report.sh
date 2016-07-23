python daily-market-report.py > /tmp/out-temp.html
wkhtmltopdf /tmp/out-temp.html /tmp/market-report.pdf
python copy-market-report.py
