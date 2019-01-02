lineCount = 0
featureCount = 0
developing = 0
finished = 0
notStart = 0

with open('./design.txt') as f:
  for eachline in f:
    eachline = eachline.strip()
    if eachline.startswith('#'):
      continue
    if eachline.startswith("*"):
      lineCount += 1
    if eachline.startswith("* ["):
      featureCount += 1
      if eachline.startswith("* [d"):
        developing += 1
      elif eachline.startswith("* [f"):
        finished += 1
      elif eachline.startswith("* [ "):
        notStart += 1
result='''
     lines: {lineCount:4d}
  features: {featureCount:4d}
developing: {developing:4d}
  finished: {finished:4d}
  notStart: {notStart:4d}
'''.format(**globals())
print(result)
