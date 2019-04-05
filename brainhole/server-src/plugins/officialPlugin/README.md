# officialPlugin

Provide several basic Hooks


# Hooks

## 1. groupRelationTag
A hook to collect tags as group and automatically add relations for each other.
examples:
* 'translation' is a symmetric relation, if we have these relations
  * foo(en) <==translation=> foo(zh)
  * foo(zh) <==translation=> foo(jp)
  * foo(jp) <==translation=> foo(fr)
  * bar(en) <==translation=> bar(zh)
  * bar(zh) <==translation=> bar(jp)
  * bar(jp) <==translation=> bar(fr)

  logically, we should also have these relaotion
    * foo(en) <==translation=> foo(jp)
    * foo(en) <==translation=> foo(fr)
    * foo(zh) <==translation=> foo(en)
    * foo(zh) <==translation=> foo(fr)
    * bar(en) <==translation=> bar(jp)
    * bar(en) <==translation=> bar(fr)
    * bar(zh) <==translation=> bar(en)
    * bar(zh) <==translation=> bar(fr)

  it will be more clear if we say: the relation 'translation' forms two group
    1. foo(en), foo(zh), foo(jp), foo(fr)
    2. bar(en), bar(zh), bar(jp), bar(fr)

  each group number have the 'translation' relation to other numbers in the same group

This hook will calculate all relation groups and automatically add missing relations for all group number.

## 2. ancestorTags
* when add a tag, also add its ancestor tags.
* comments: add or delete the ancestor tags only when a tag is add or delete with origin.id === 'manual'
## 3. simularTags
* when add a tag, also add tags that have 'simular' relation with this tag.
* comments:
  * in level 0: force add(delete) tags with simularTags(no matter what origin of these tags)
  * in higher level: only perform the operation when origin_flags.entry or modifiy_flags.entry is true
