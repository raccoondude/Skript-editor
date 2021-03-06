"use strict";
var Anchor = exports.Anchor = function(doc, row, column) {
  this.$onChange = this.onChange.bind(this);
  this.attach(doc);

  if (typeof column == "undefined")
    this.setPosition(row.row, row.column);
  else
    this.setPosition(row, column);
};

(function() {

  this.getPosition = function() {
    return this.$clipPositionToDocument(this.row, this.column);
  };
  this.getDocument = function() {
    return this.document;
  };
  this.$insertRight = false;
  this.onChange = function(delta) {
    if (delta.start.row == delta.end.row && delta.start.row != this.row)
      return;

    if (delta.start.row > this.row)
      return;

    var point = $getTransformedPoint(delta, {
      row: this.row,
      column: this.column
    }, this.$insertRight);
    this.setPosition(point.row, point.column, true);
  };

  function $pointsInOrder(point1, point2, equalPointsInOrder) {
    var bColIsAfter = equalPointsInOrder ? point1.column <= point2.column : point1.column < point2.column;
    return (point1.row < point2.row) || (point1.row == point2.row && bColIsAfter);
  }

  function $getTransformedPoint(delta, point, moveIfEqual) {
    var deltaIsInsert = delta.action == "insert";
    var deltaRowShift = (deltaIsInsert ? 1 : -1) * (delta.end.row - delta.start.row);
    var deltaColShift = (deltaIsInsert ? 1 : -1) * (delta.end.column - delta.start.column);
    var deltaStart = delta.start;
    var deltaEnd = deltaIsInsert ? deltaStart : delta.end; // Collapse insert range.
    if ($pointsInOrder(point, deltaStart, moveIfEqual)) {
      return {
        row: point.row,
        column: point.column
      };
    }
    if ($pointsInOrder(deltaEnd, point, !moveIfEqual)) {
      return {
        row: point.row + deltaRowShift,
        column: point.column + (point.row == deltaEnd.row ? deltaColShift : 0)
      };
    }

    return {
      row: deltaStart.row,
      column: deltaStart.column
    };
  }
  this.setPosition = function(row, column, noClip) {
    var pos;
    if (noClip) {
      pos = {
        row: row,
        column: column
      };
    } else {
      pos = this.$clipPositionToDocument(row, column);
    }

    if (this.row == pos.row && this.column == pos.column)
      return;

    var old = {
      row: this.row,
      column: this.column
    };

    this.row = pos.row;
    this.column = pos.column;
  };
  this.detach = function() {
    this.document.removeEventListener("change", this.$onChange);
  };
  this.attach = function(doc) {
    this.document = doc || this.document;
    this.document.on("change", this.$onChange);
  };
  this.$clipPositionToDocument = function(row, column) {
    var pos = {};

    if (row >= this.document.getLength()) {
      pos.row = Math.max(0, this.document.getLength() - 1);
      pos.column = this.document.getLine(pos.row).length;
    } else if (row < 0) {
      pos.row = 0;
      pos.column = 0;
    } else {
      pos.row = row;
      pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
    }

    if (column < 0)
      pos.column = 0;

    return pos;
  };

}).call(Anchor.prototype);

var comparePoints = function(p1, p2) {
  return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
  this.start = {
    row: startRow,
    column: startColumn
  };

  this.end = {
    row: endRow,
    column: endColumn
  };
};

(function() {
  this.isEqual = function(range) {
    return this.start.row === range.start.row &&
      this.end.row === range.end.row &&
      this.start.column === range.start.column &&
      this.end.column === range.end.column;
  };
  this.toString = function() {
    return ("Range: [" + this.start.row + "/" + this.start.column +
      "] -> [" + this.end.row + "/" + this.end.column + "]");
  };

  this.contains = function(row, column) {
    return this.compare(row, column) == 0;
  };
  this.compareRange = function(range) {
    var cmp,
      end = range.end,
      start = range.start;

    cmp = this.compare(end.row, end.column);
    if (cmp == 1) {
      cmp = this.compare(start.row, start.column);
      if (cmp == 1) {
        return 2;
      } else if (cmp == 0) {
        return 1;
      } else {
        return 0;
      }
    } else if (cmp == -1) {
      return -2;
    } else {
      cmp = this.compare(start.row, start.column);
      if (cmp == -1) {
        return -1;
      } else if (cmp == 1) {
        return 42;
      } else {
        return 0;
      }
    }
  };
  this.comparePoint = function(p) {
    return this.compare(p.row, p.column);
  };
  this.containsRange = function(range) {
    return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
  };
  this.intersects = function(range) {
    var cmp = this.compareRange(range);
    return (cmp == -1 || cmp == 0 || cmp == 1);
  };
  this.isEnd = function(row, column) {
    return this.end.row == row && this.end.column == column;
  };
  this.isStart = function(row, column) {
    return this.start.row == row && this.start.column == column;
  };
  this.setStart = function(row, column) {
    if (typeof row == "object") {
      this.start.column = row.column;
      this.start.row = row.row;
    } else {
      this.start.row = row;
      this.start.column = column;
    }
  };
  this.setEnd = function(row, column) {
    if (typeof row == "object") {
      this.end.column = row.column;
      this.end.row = row.row;
    } else {
      this.end.row = row;
      this.end.column = column;
    }
  };
  this.inside = function(row, column) {
    if (this.compare(row, column) == 0) {
      if (this.isEnd(row, column) || this.isStart(row, column)) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };
  this.insideStart = function(row, column) {
    if (this.compare(row, column) == 0) {
      if (this.isEnd(row, column)) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };
  this.insideEnd = function(row, column) {
    if (this.compare(row, column) == 0) {
      if (this.isStart(row, column)) {
        return false;
      } else {
        return true;
      }
    }
    return false;
  };
  this.compare = function(row, column) {
    if (!this.isMultiLine()) {
      if (row === this.start.row) {
        return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
      }
    }

    if (row < this.start.row)
      return -1;

    if (row > this.end.row)
      return 1;

    if (this.start.row === row)
      return column >= this.start.column ? 0 : -1;

    if (this.end.row === row)
      return column <= this.end.column ? 0 : 1;

    return 0;
  };
  this.compareStart = function(row, column) {
    if (this.start.row == row && this.start.column == column) {
      return -1;
    } else {
      return this.compare(row, column);
    }
  };
  this.compareEnd = function(row, column) {
    if (this.end.row == row && this.end.column == column) {
      return 1;
    } else {
      return this.compare(row, column);
    }
  };
  this.compareInside = function(row, column) {
    if (this.end.row == row && this.end.column == column) {
      return 1;
    } else if (this.start.row == row && this.start.column == column) {
      return -1;
    } else {
      return this.compare(row, column);
    }
  };
  this.clipRows = function(firstRow, lastRow) {
    if (this.end.row > lastRow)
      var end = {
        row: lastRow + 1,
        column: 0
      };
    else if (this.end.row < firstRow)
      var end = {
        row: firstRow,
        column: 0
      };

    if (this.start.row > lastRow)
      var start = {
        row: lastRow + 1,
        column: 0
      };
    else if (this.start.row < firstRow)
      var start = {
        row: firstRow,
        column: 0
      };

    return Range.fromPoints(start || this.start, end || this.end);
  };
  this.extend = function(row, column) {
    var cmp = this.compare(row, column);

    if (cmp == 0)
      return this;
    else if (cmp == -1)
      var start = {
        row: row,
        column: column
      };
    else
      var end = {
        row: row,
        column: column
      };

    return Range.fromPoints(start || this.start, end || this.end);
  };

  this.isEmpty = function() {
    return (this.start.row === this.end.row && this.start.column === this.end.column);
  };
  this.isMultiLine = function() {
    return (this.start.row !== this.end.row);
  };
  this.clone = function() {
    return Range.fromPoints(this.start, this.end);
  };
  this.collapseRows = function() {
    if (this.end.column == 0)
      return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row - 1), 0);
    else
      return new Range(this.start.row, 0, this.end.row, 0);
  };
  this.toScreenRange = function(session) {
    var screenPosStart = session.documentToScreenPosition(this.start);
    var screenPosEnd = session.documentToScreenPosition(this.end);

    return new Range(
      screenPosStart.row, screenPosStart.column,
      screenPosEnd.row, screenPosEnd.column
    );
  };
  this.moveBy = function(row, column) {
    this.start.row += row;
    this.start.column += column;
    this.end.row += row;
    this.end.column += column;
  };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
  return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
  return p1.row - p2.row || p1.column - p2.column;
};

function throwDeltaError(delta, errorText) {
  console.log("Invalid Delta:", delta);
  throw "Invalid Delta: " + errorText;
}

function positionInDocument(docLines, position) {
  return position.row >= 0 && position.row < docLines.length &&
    position.column >= 0 && position.column <= docLines[position.row].length;
}

function validateDelta(docLines, delta) {
  if (delta.action != "insert" && delta.action != "remove")
    throwDeltaError(delta, "delta.action must be 'insert' or 'remove'");
  if (!(delta.lines instanceof Array))
    throwDeltaError(delta, "delta.lines must be an Array");
  if (!delta.start || !delta.end)
    throwDeltaError(delta, "delta.start/end must be an present");
  var start = delta.start;
  if (!positionInDocument(docLines, delta.start))
    throwDeltaError(delta, "delta.start must be contained in document");
  var end = delta.end;
  if (delta.action == "remove" && !positionInDocument(docLines, end))
    throwDeltaError(delta, "delta.end must contained in document for 'remove' actions");
  var numRangeRows = end.row - start.row;
  var numRangeLastLineChars = (end.column - (numRangeRows == 0 ? start.column : 0));
  if (numRangeRows != delta.lines.length - 1 || delta.lines[numRangeRows].length != numRangeLastLineChars)
    throwDeltaError(delta, "delta.range must match delta lines");
}

function applyDelta(docLines, delta, doNotValidate) {

  var row = delta.start.row;
  var startColumn = delta.start.column;
  var line = docLines[row] || "";
  switch (delta.action) {
    case "insert":
      var lines = delta.lines;
      if (lines.length === 1) {
        docLines[row] = line.substring(0, startColumn) + delta.lines[0] + line.substring(startColumn);
      } else {
        var args = [row, 1].concat(delta.lines);
        docLines.splice.apply(docLines, args);
        docLines[row] = line.substring(0, startColumn) + docLines[row];
        docLines[row + delta.lines.length - 1] += line.substring(startColumn);
      }
      break;
    case "remove":
      var endColumn = delta.end.column;
      var endRow = delta.end.row;
      if (row === endRow) {
        docLines[row] = line.substring(0, startColumn) + line.substring(endColumn);
      } else {
        docLines.splice(
          row, endRow - row + 1,
          line.substring(0, startColumn) + docLines[endRow].substring(endColumn)
        );
      }
      break;
  }
};

var Document = function(textOrLines) {
  this.$lines = [""];
  if (textOrLines.length === 0) {
    this.$lines = [""];
  } else if (Array.isArray(textOrLines)) {
    this.insertMergedLines({
      row: 0,
      column: 0
    }, textOrLines);
  } else {
    this.insert({
      row: 0,
      column: 0
    }, textOrLines);
  }
};

(function() {

  this.setValue = function(text) {
    var len = this.getLength() - 1;
    this.remove(new Range(0, 0, len, this.getLine(len).length));
    this.insert({
      row: 0,
      column: 0
    }, text);
  };
  this.getValue = function() {
    return this.getAllLines().join(this.getNewLineCharacter());
  };
  this.createAnchor = function(row, column) {
    return new Anchor(this, row, column);
  };
  if ("aaa".split(/a/).length === 0) {
    this.$split = function(text) {
      return text.replace(/\r\n|\r/g, "\n").split("\n");
    };
  } else {
    this.$split = function(text) {
      return text.split(/\r\n|\r|\n/);
    };
  }


  this.$detectNewLine = function(text) {
    var match = text.match(/^.*?(\r\n|\r|\n)/m);
    this.$autoNewLine = match ? match[1] : "\n";
  };
  this.getNewLineCharacter = function() {
    switch (this.$newLineMode) {
      case "windows":
        return "\r\n";
      case "unix":
        return "\n";
      default:
        return this.$autoNewLine || "\n";
    }
  };

  this.$autoNewLine = "";
  this.$newLineMode = "auto";
  this.setNewLineMode = function(newLineMode) {
    if (this.$newLineMode === newLineMode)
      return;

    this.$newLineMode = newLineMode;
  };
  this.getNewLineMode = function() {
    return this.$newLineMode;
  };
  this.isNewLine = function(text) {
    return (text == "\r\n" || text == "\r" || text == "\n");
  };
  this.getLine = function(row) {
    return this.$lines[row] || "";
  };
  this.getLines = function(firstRow, lastRow) {
    return this.$lines.slice(firstRow, lastRow + 1);
  };
  this.getAllLines = function() {
    return this.getLines(0, this.getLength());
  };
  this.getLength = function() {
    return this.$lines.length;
  };
  this.getTextRange = function(range) {
    return this.getLinesForRange(range).join(this.getNewLineCharacter());
  };
  this.getLinesForRange = function(range) {
    var lines;
    if (range.start.row === range.end.row) {
      lines = [this.getLine(range.start.row).substring(range.start.column, range.end.column)];
    } else {
      lines = this.getLines(range.start.row, range.end.row);
      lines[0] = (lines[0] || "").substring(range.start.column);
      var l = lines.length - 1;
      if (range.end.row - range.start.row == l)
        lines[l] = lines[l].substring(0, range.end.column);
    }
    return lines;
  };
  this.insertLines = function(row, lines) {
    console.warn("Use of document.insertLines is deprecated. Use the insertFullLines method instead.");
    return this.insertFullLines(row, lines);
  };
  this.removeLines = function(firstRow, lastRow) {
    console.warn("Use of document.removeLines is deprecated. Use the removeFullLines method instead.");
    return this.removeFullLines(firstRow, lastRow);
  };
  this.insertNewLine = function(position) {
    console.warn("Use of document.insertNewLine is deprecated. Use insertMergedLines(position, ['', '']) instead.");
    return this.insertMergedLines(position, ["", ""]);
  };
  this.insert = function(position, text) {
    if (this.getLength() <= 1)
      this.$detectNewLine(text);

    return this.insertMergedLines(position, this.$split(text));
  };
  this.insertInLine = function(position, text) {
    var start = this.clippedPos(position.row, position.column);
    var end = this.pos(position.row, position.column + text.length);

    this.applyDelta({
      start: start,
      end: end,
      action: "insert",
      lines: [text]
    }, true);

    return this.clonePos(end);
  };

  this.clippedPos = function(row, column) {
    var length = this.getLength();
    if (row === undefined) {
      row = length;
    } else if (row < 0) {
      row = 0;
    } else if (row >= length) {
      row = length - 1;
      column = undefined;
    }
    var line = this.getLine(row);
    if (column == undefined)
      column = line.length;
    column = Math.min(Math.max(column, 0), line.length);
    return {
      row: row,
      column: column
    };
  };

  this.clonePos = function(pos) {
    return {
      row: pos.row,
      column: pos.column
    };
  };

  this.pos = function(row, column) {
    return {
      row: row,
      column: column
    };
  };

  this.$clipPosition = function(position) {
    var length = this.getLength();
    if (position.row >= length) {
      position.row = Math.max(0, length - 1);
      position.column = this.getLine(length - 1).length;
    } else {
      position.row = Math.max(0, position.row);
      position.column = Math.min(Math.max(position.column, 0), this.getLine(position.row).length);
    }
    return position;
  };
  this.insertFullLines = function(row, lines) {
    row = Math.min(Math.max(row, 0), this.getLength());
    var column = 0;
    if (row < this.getLength()) {
      lines = lines.concat([""]);
      column = 0;
    } else {
      lines = [""].concat(lines);
      row--;
      column = this.$lines[row].length;
    }
    this.insertMergedLines({
      row: row,
      column: column
    }, lines);
  };
  this.insertMergedLines = function(position, lines) {
    var start = this.clippedPos(position.row, position.column);
    var end = {
      row: start.row + lines.length - 1,
      column: (lines.length == 1 ? start.column : 0) + lines[lines.length - 1].length
    };

    this.applyDelta({
      start: start,
      end: end,
      action: "insert",
      lines: lines
    });

    return this.clonePos(end);
  };
  this.remove = function(range) {
    var start = this.clippedPos(range.start.row, range.start.column);
    var end = this.clippedPos(range.end.row, range.end.column);
    this.applyDelta({
      start: start,
      end: end,
      action: "remove",
      lines: this.getLinesForRange({
        start: start,
        end: end
      })
    });
    return this.clonePos(start);
  };
  this.removeInLine = function(row, startColumn, endColumn) {
    var start = this.clippedPos(row, startColumn);
    var end = this.clippedPos(row, endColumn);

    this.applyDelta({
      start: start,
      end: end,
      action: "remove",
      lines: this.getLinesForRange({
        start: start,
        end: end
      })
    }, true);

    return this.clonePos(start);
  };
  this.removeFullLines = function(firstRow, lastRow) {
    firstRow = Math.min(Math.max(0, firstRow), this.getLength() - 1);
    lastRow = Math.min(Math.max(0, lastRow), this.getLength() - 1);
    var deleteFirstNewLine = lastRow == this.getLength() - 1 && firstRow > 0;
    var deleteLastNewLine = lastRow < this.getLength() - 1;
    var startRow = (deleteFirstNewLine ? firstRow - 1 : firstRow);
    var startCol = (deleteFirstNewLine ? this.getLine(startRow).length : 0);
    var endRow = (deleteLastNewLine ? lastRow + 1 : lastRow);
    var endCol = (deleteLastNewLine ? 0 : this.getLine(endRow).length);
    var range = new Range(startRow, startCol, endRow, endCol);
    var deletedLines = this.$lines.slice(firstRow, lastRow + 1);

    this.applyDelta({
      start: range.start,
      end: range.end,
      action: "remove",
      lines: this.getLinesForRange(range)
    });
    return deletedLines;
  };
  this.removeNewLine = function(row) {
    if (row < this.getLength() - 1 && row >= 0) {
      this.applyDelta({
        start: this.pos(row, this.getLine(row).length),
        end: this.pos(row + 1, 0),
        action: "remove",
        lines: ["", ""]
      });
    }
  };
  this.replace = function(range, text) {
    if (!(range instanceof Range))
      range = Range.fromPoints(range.start, range.end);
    if (text.length === 0 && range.isEmpty())
      return range.start;
    if (text == this.getTextRange(range))
      return range.end;

    this.remove(range);
    var end;
    if (text) {
      end = this.insert(range.start, text);
    } else {
      end = range.start;
    }

    return end;
  };
  this.applyDeltas = function(deltas) {
    for (var i = 0; i < deltas.length; i++) {
      this.applyDelta(deltas[i]);
    }
  };
  this.revertDeltas = function(deltas) {
    for (var i = deltas.length - 1; i >= 0; i--) {
      this.revertDelta(deltas[i]);
    }
  };
  this.applyDelta = function(delta, doNotValidate) {
    var isInsert = delta.action == "insert";
    if (isInsert ? delta.lines.length <= 1 && !delta.lines[0] :
      !Range.comparePoints(delta.start, delta.end)) {
      return;
    }

    if (isInsert && delta.lines.length > 20000) {
      this.$splitAndapplyLargeDelta(delta, 20000);
    } else {
      applyDelta(this.$lines, delta, doNotValidate);
    }
  };

  this.$splitAndapplyLargeDelta = function(delta, MAX) {
    var lines = delta.lines;
    var l = lines.length - MAX + 1;
    var row = delta.start.row;
    var column = delta.start.column;
    for (var from = 0, to = 0; from < l; from = to) {
      to += MAX - 1;
      var chunk = lines.slice(from, to);
      chunk.push("");
      this.applyDelta({
        start: this.pos(row + from, column),
        end: this.pos(row + to, column = 0),
        action: delta.action,
        lines: chunk
      }, true);
    }
    delta.lines = lines.slice(from);
    delta.start.row = row + from;
    delta.start.column = column;
    this.applyDelta(delta, true);
  };
  this.revertDelta = function(delta) {
    this.applyDelta({
      start: this.clonePos(delta.start),
      end: this.clonePos(delta.end),
      action: (delta.action == "insert" ? "remove" : "insert"),
      lines: delta.lines.slice()
    });
  };
  this.indexToPosition = function(index, startRow) {
    var lines = this.$lines || this.getAllLines();
    var newlineLength = this.getNewLineCharacter().length;
    for (var i = startRow || 0, l = lines.length; i < l; i++) {
      index -= lines[i].length + newlineLength;
      if (index < 0)
        return {
          row: i,
          column: index + lines[i].length + newlineLength
        };
    }
    return {
      row: l - 1,
      column: index + lines[l - 1].length + newlineLength
    };
  };
  this.positionToIndex = function(pos, startRow) {
    var lines = this.$lines || this.getAllLines();
    var newlineLength = this.getNewLineCharacter().length;
    var index = 0;
    var row = Math.min(pos.row, lines.length);
    for (var i = startRow || 0; i < row; ++i)
      index += lines[i].length + newlineLength;

    return index + pos.column;
  };

}).call(Document.prototype);

exports.Document = Document;