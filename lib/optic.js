'use babel';
import OpticView from './optic-view';
import { CompositeDisposable } from 'atom';
import { EditorConnection, checkForSearch } from 'optic-editor-sdk'
import {exec} from 'child_process'
import setText from 'atom-set-text'
function bufferedRangeToRange(bufferedRange, editor) {
  var lines = [];
  for (line = 0; line < bufferedRange.row ; line++) {
    lines.push(editor.lineTextForBufferRow(line))
  }

  return lines.join('').length + bufferedRange.row + bufferedRange.column;
}

export default {

  subscriptions: null,
  editorConnection: null,

  initialize(state) {

    let plugin = this;
    exec('open /Applications/Optic.app')
    this.editorConnection = EditorConnection({name: 'atom'})

    this.editorConnection.onFilesUpdated((msg)=> {
      const files = Object.keys(msg.updates)

      files.forEach(i=> {
        atom.workspace.open(i, {searchAllPanes: true}).then((editor)=> {
          console.log(editor)
          setText(msg.updates[i], editor)
        })
      })

      // //refresh all
      // atom.workspace.getTextEditors().forEach(i=> {
      //   i.getBuffer().reload()
      // })

    })

    this.subscriptions = new CompositeDisposable();

    atom.workspace.observeTextEditors((editor) => {
      editor.onDidStopChanging((didStop)=> {
        // console.log(didStop)
        const file = editor.getPath()
        const contents = editor.getText()
        const bufferedRange = editor.getSelectedBufferRange()
        const start = bufferedRangeToRange(bufferedRange.start, editor)
        const end = bufferedRangeToRange(bufferedRange.end, editor)

        const line = editor.lineTextForBufferRow(bufferedRange.start.row)
        const startInLine = bufferedRange.start.column
        const endInline = (bufferedRange.end.row !== bufferedRange.start.row) ? line.length - 1 : bufferedRange.end.column
        const searchCheck = checkForSearch(line, startInLine, endInline)

        // console.log(searchCheck)

        try {
          if (searchCheck.isSearch) {
            this.editorConnection.actions.search(file, start, end, searchCheck.query, contents)
          } else {
            this.editorConnection.actions.context(file, start, end, contents)
          }

        } catch (e) {
          console.error(e)
        }

      })
      editor.onDidChangeCursorPosition((position)=> {
        const file = editor.getPath()
        const contents = editor.getText()
        const bufferedRange = editor.getSelectedBufferRange()
        const start = bufferedRangeToRange(bufferedRange.start, editor)
        const end = bufferedRangeToRange(bufferedRange.end, editor)

        const line = editor.lineTextForBufferRow(bufferedRange.start.row)
        const startInLine = bufferedRange.start.column
        const endInline = (bufferedRange.end.row !== bufferedRange.start.row) ? line.length - 1 : bufferedRange.end.column
        const searchCheck = checkForSearch(line, startInLine, endInline)

        try {
          if (!searchCheck.isSearch) {
            this.editorConnection.actions.context(file, start, end, contents)
          }
        } catch (e) {
          console.error(e)
        }

      })
    })
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.opticView.destroy();
  },

  serialize() {
    return {

    };
  },

  toggle() {
    console.log('Optic was toggled!');
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
  }

};
