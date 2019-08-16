const fs              = require('fs').promises;
const marked          = require('marked')
class Markdown {
  constructor() {
    this.buildText = this.buildText.bind(this)
    this.buildFile = this.buildFile.bind(this)
  }
  
  async buildText (txt, options) {
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="description" content="${options.desc}"/>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${options.title}</title>
  </head>
  <body>
    ${marked.parse(txt)}
    <style>@import url("${options.style}");</style>
  </body>
</html>
`
  }
  
  async buildFile (file, options) {
    return await this.buildText(await fs.readFile(file, 'utf8'), options)
  }
}
module.exports = new Markdown()