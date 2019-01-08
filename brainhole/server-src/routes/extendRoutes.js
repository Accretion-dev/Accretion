export default function (routes, resolve) {
  routes.forEach(item => {
    if (!item.path.endsWith('/')) {
      item.path = item.path + '/'
    }
    if (!item.pathToRegexpOptions) {
      item.pathToRegexpOptions = { strict: true }
    }
    if (item.path === '/test/') {
      item.name='root-test'
      item.props = true
      delete item.pathToRegexpOptions
    }
  })
  console.log('new routes:', routes)
}
