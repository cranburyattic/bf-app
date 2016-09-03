import yaml
from time import gmtime, strftime
from shutil import copy

with open('../config/betfair_config.yml', 'r') as f:
    doc = yaml.load(f)

data_dir = doc['default']['betfair']['data_dir']
todays_date = strftime('%Y-%-m-%-d', gmtime())

src='/tmp/bet-report.pdf'
dest=data_dir + '/data/' + todays_date + '/bet-report.pdf'

copy(src,dest)
