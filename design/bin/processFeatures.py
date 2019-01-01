import os
import sys
import re
filename = sys.argv[1]
print('process file: ', filename)
f = open(filename, 'r')

def getIndent(s):
  count = len(s) - len(s.lstrip(' '))
  return int(count/2)

features = []
prefix = []
suffix = []

property = None

for linenum, eachline in enumerate(f, start=1):
  if eachline.startswith('\n'):
    continue # skip blank line

  eachline = eachline[:-1]
  indent = getIndent(eachline)
  if indent == 0 and eachline.startswith('*'): # define for new feature
    fmt = r'\* \[[ pdfr?]\] \d{4}-\d{2}-\d{2} '
    assert re.match(fmt, eachline), 'line: {}: feature format error, should be "* [ |p|d|f|r|?] yyyy-mm-dd Title"'.format(linenum)
    state = eachline[3]
    date = eachline[6:16]
    title = eachline[17:]
    thisContent = [eachline]
    thisFeature = {
      'title': title,
      'date': date,
      'content': thisContent,
      'state': state
      }
    features.append(thisFeature)
    property = None
  elif indent == 0 and not eachline.startswith('*'):
    if len(features)==0:
      prefix.append(eachline)
    elif len(features) != 0 and eachline.startswith('#'):
      suffix.append(eachline)
    elif eachline.startswith('" vim'):
      suffix.append(eachline)
  elif indent == 1:
    if ':' not in eachline:
      raise Exception('line: {}: unknown property: {}'.format(linenum, eachline))
    property = eachline.split(':')[0].strip()
    content = ':'.join(eachline.split(':')[1:])
    #print('{:3d}:{}:{}'.format(linenum, indent, eachline, property, content))
  if indent >= 1:
    thisFeature['content'].append(eachline)
    if property == 'tags':
      if indent != 1:
        raise Exception('line: {}: tags should be defined in one line: {}'.format(linenum, eachline))
      if not content:
        raise Exception('line: {}: shoud give tags after "tags: ": {}'.format(linenum, eachline))
      thisFeature[property] = list(map(lambda _:_.strip(), content.split(',')))
    elif property in ['desc', 'tree', 'stat', 'disc']:
      if thisFeature.get(property) is None:
        thisFeature[property] = []
        if indent == 1 and content:
          thisFeature[property].append(content)
      else:
        content = eachline[2*2:]# indent must be 2
        if property == 'tree':
          content = content.strip()
        thisFeature[property].append(content)
    else: # just record all other properties
      if thisFeature.get(property) is None:
        thisFeature[property] = []
        if indent == 1 and content:
          thisFeature[property].append(content)
      else:
        content = eachline[2*2:]# indent must be 2
        thisFeature[property].append(content)
f.close()

tags = []
trees = []
stat = {
  "d": 'developing',
  "p": 'planned',
  " ": 'proposed',
  "f": 'finished',
  "r": 'rejected',
  "?": 'under debate',
}
for each in features:
  tags.extend(each.get('tags', []))
  trees.extend(each.get('tree', []))
tags = sorted(list(set(tags)))
trees = sorted(list(set(trees)))
tags.append(None)
trees.append(None)

filename_raw, file_extension = os.path.splitext(filename)
# outputs
with open(filename_raw + '_by_tags' + file_extension, 'w') as f:
  f.write('\n'.join(prefix)+'\n')
  for tag in tags:
    if tag is None:
      todo = list(filter(lambda _:_.get('tags') is None, features))
      count = len(todo)
      f.write('untagged({}):\n'.format(count))
    else:
      todo = list(filter(lambda _:tag in _.get('tags', []), features))
      count = len(todo)
      f.write('{}({}):\n'.format(tag, count))
    todo = sorted(todo, key=lambda _:_['date'])
    for each in todo:
      newContent = list(map(lambda _:'  '+_, each['content']))
      f.write('\n'.join(newContent)+'\n')
  f.write('\n'.join(suffix))

with open(filename_raw + '_by_catalogue' + file_extension, 'w') as f:
  f.write('\n'.join(prefix)+'\n')
  for tree in trees:
    if tree is None:
      todo = list(filter(lambda _:_.get('tree') is None, features))
      count = len(todo)
      f.write('default({}):\n'.format(count))
    else:
      todo = list(filter(lambda _:tree in _.get('tree', []), features))
      count = len(todo)
      f.write('{}({}):\n'.format(tree, count))
    todo = sorted(todo, key=lambda _:_['date'])
    for each in todo:
      newContent = list(map(lambda _:'  '+_, each['content']))
      f.write('\n'.join(newContent)+'\n')
  f.write('\n'.join(suffix))

with open(filename_raw + '_by_state' + file_extension, 'w') as f:
  f.write('\n'.join(prefix)+'\n')
  for state in stat:
    stateName = stat[state]
    todo = list(filter(lambda _:_['state'] == state, features))
    count = len(todo)
    f.write('{}({}):\n'.format(stateName, count))
    todo = sorted(todo, key=lambda _:_['date'])
    for each in todo:
      newContent = list(map(lambda _:'  '+_, each['content']))
      f.write('\n'.join(newContent)+'\n')
  f.write('\n'.join(suffix))
