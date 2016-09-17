import matplotlib as mpl
mpl.use('Agg')
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import yaml

from time import gmtime, strftime, localtime
from jinja2 import Environment, FileSystemLoader

with open('../config/betfair_config.yml', 'r') as f:
    doc = yaml.load(f)
    data_dir = doc['default']['betfair']['data_dir']

todays_date = strftime('%Y-%-m-%-d', gmtime())

env = Environment(loader=FileSystemLoader('.'))
template = env.get_template('bet-report.html')


bets = pd.read_csv(data_dir + '/data/' + todays_date+ '/all-bets.csv')

df_bets_pivot = pd.pivot_table(bets,index=["horseName"],values=["profit"], aggfunc=np.sum)
df_bets_pivot_total = pd.pivot_table(bets,index=["horseName"],values=["profit"], aggfunc=np.sum, margins=True)
df_bets_pivot_selection = pd.pivot_table(bets,index=["selectionId"],values=["profit"], aggfunc=np.sum)
df_bets = df_bets_pivot.plot(kind='bar')
df_bets.get_figure().savefig('profit-loss.png');

f = open(data_dir + '/data/' + todays_date + '/processed.txt', 'r')
line = f.readline()
files = line.split(',')
f.close()

images = ''
for file in files:
    profitLoss = df_bets_pivot_selection.get_value(int(file.split('-')[1]),'profit')
    images += '<img src="' + data_dir + '/data/' + todays_date + '/charts/chart-' + file+ '.png"/>'
    images += '<img src="' + data_dir + '/data/' + todays_date + '/charts/insights-chart-' + file+ '.png"/>'
    images +='<div><h3>Profit/Loss = ' + str(profitLoss) + '<h3></div>'

template_vars = {'title' : 'Bets Report - ' + strftime('%Y-%m-%d %H:%M:%S', localtime()),
                  'profit_loss': df_bets_pivot_total.to_html(),
                  'profit_loss_summary': df_bets_pivot.describe().to_html(),
                  'images': images}
html_out = template.render(template_vars)
print(html_out)
