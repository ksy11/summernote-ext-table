(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function ($) {

    // add table / table col resize start
    var JTablePlugin = function (context) {
        var self = this,
            dom = $.summernote.dom,
            ui = $.summernote.ui,
            options = context.options,
            modules = context.modules,
            lang = options.langInfo,
            $mergeDialog,
            $tableInfoDialog;

        var tableResize = {
            pressed        : false,
            rightFlag      : false,
            bottomFlag     : false,
            currentTableEl : undefined,
            currentTrEl    : undefined,
            firstTdEl      : undefined,
            colEl          : undefined,
            currentTdEl    : undefined,
            currentTdLeft  : undefined,
            currentTdRight : undefined,
            currentTdTop   : undefined,
            currentTdBottom: undefined,
            startX         : undefined,
            startWidth     : undefined,
            startY         : undefined,
            startHeight    : undefined,
            contenteditable: false
        };

        var tableBlock = {
            pressed          : false,
            currentTableEl   : undefined,
            currentTdEl      : undefined,
            currentTdLeft    : undefined,
            currentTdRight   : undefined,
            currentTdTop     : undefined,
            currentTdBottom  : undefined,
            currentTdPosition: {
                row: undefined,
                col: undefined,
            },
            width            : undefined,
            height           : undefined,
            top              : undefined,
            left             : undefined,
            effect           : {
                row: {
                    start: undefined,
                    end  : undefined,
                },
                col: {
                    start: undefined,
                    end  : undefined,
                },
            },
        };

        var addRowCol = [
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.rowAbove),
                tooltip  : lang.table.addRowAbove,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jAddRow', 'top'),
            }),
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.rowBelow),
                tooltip  : lang.table.addRowBelow,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jAddRow', 'bottom'),
            }),
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.colBefore),
                tooltip  : lang.table.addColLeft,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jAddCol', 'left'),
            }),
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.colAfter),
                tooltip  : lang.table.addColRight,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jAddCol', 'right'),
            })
        ];

        var deleteRowCol = [
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.rowRemove),
                tooltip  : lang.table.delRow,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jDeleteRow'),
            }),
            ui.button({
                className: 'btn-md',
                contents : ui.icon(options.icons.colRemove),
                tooltip  : lang.table.delCol,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jDeleteCol'),
            })
        ];

        context.memo('button.jAddDeleteRowCol', function () {
            return ui.buttonGroup({
                className: 'jtable-add-del-row-col',
                children : [
                    ui.button({
                        className: 'dropdown-toggle',
                        contents : ui.dropdownButtonContents(ui.icon(options.icons.rowAbove), options),
                        tooltip  : lang.jTable.addDeleteRowCOl,
                        container: options.container,
                        data     : {
                            toggle: 'dropdown',
                        },
                        click    : function (event) {
                            var $parent = $(this).closest('.jtable-add-del-row-col');
                            var $btns = $parent.find('.btn-md');

                            var hasSpan = false;

                            var rng = modules.editor.getLastRange.call(modules.editor);
                            if (rng.isCollapsed() && rng.isOnCell()) {
                                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                                hasSpan = (cell.rowSpan > 1) || (cell.colSpan > 1);

                                if (!hasSpan) {
                                    var $table = $(cell).closest('table');
                                    var $tr = $(cell).closest('tr');
                                    var trIndex = $tr[0].rowIndex;

                                    var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
                                    var matrixTable = vTable.getMatrixTable();
                                    var tdList = matrixTable[trIndex];

                                    var currentTdIndex = 0;
                                    for (var colIndex = 0; colIndex < tdList.length; colIndex++) {
                                        var virtualTd = tdList[colIndex];
                                        if (!virtualTd.isVirtual && cell == virtualTd.baseCell) currentTdIndex = colIndex;
                                        if (virtualTd.baseCell.colSpan > 1 || virtualTd.baseCell.rowSpan > 1) {
                                            hasSpan = true;
                                        }
                                    }

                                    for (var rowIndex = 0; rowIndex < matrixTable.length; rowIndex++) {
                                        var virtualTd = matrixTable[rowIndex][currentTdIndex];
                                        if (virtualTd.baseCell.colSpan > 1 || virtualTd.baseCell.rowSpan > 1) {
                                            hasSpan = true;
                                        }
                                    }
                                }
                            }

                            $btns.toggleClass('disabled', hasSpan);
                            $btns.attr('disabled', hasSpan);

                            var $btnGroup = $parent.find('.jtable-add-row-col-button-group, .jtable-del-row-col-button-group');
                            var $message = $parent.find('.jtable-dropdown-message');
                            var $dropdown = $parent.find('.jtable-add-del-row-col-dropdown');
                            if (hasSpan) {
                                $btnGroup.hide();
                                $message.show();
                                $dropdown.css('width', 'auto');
                            } else {
                                $btnGroup.show();
                                $message.hide();
                                $dropdown.css('width', '');
                            }

                        },
                    }),
                    ui.dropdown({
                        className: 'jtable-add-del-row-col-dropdown',
                        children : [
                            ui.button({
                                className: 'jtable-dropdown-message',
                                contents : lang.jTable.message,
                                container: options.container,
                                // callback : function($node) {
                                //     console.log($node);
                                // },
                            }),
                            ui.buttonGroup({
                                className: 'jtable-add-row-col-button-group',
                                children : addRowCol,
                            }),
                            ui.buttonGroup({
                                className: 'jtable-del-row-col-button-group',
                                children : deleteRowCol,
                            })
                        ]
                    }),
                ]
            }).render();
        });

        self.jAddRow = function (position) {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

                var currentTr = $(cell).closest('tr');
                var trAttributes = self.recoverAttributes(currentTr);
                var html = $('<tr' + trAttributes + '></tr>');

                var vTable = new TableResultAction(cell, TableResultAction.where.Row,
                    TableResultAction.requestAction.Add, $(currentTr).closest('table')[0]);
                var actions = vTable.getActionList();

                for (var idCell = 0; idCell < actions.length; idCell++) {
                    var currentCell = actions[idCell];
                    var tdAttributes = self.recoverAttributes(currentCell.baseCell);
                    switch (currentCell.action) {
                        case TableResultAction.resultAction.AddCell:
                            html.append('<td' + tdAttributes + '>' + dom.blank + '</td>');
                            break;
                        case TableResultAction.resultAction.SumSpanCount: {
                            if (position === 'top') {
                                var baseCellTr = currentCell.baseCell.parent;
                                var isTopFromRowSpan = (!baseCellTr ? 0 : currentCell.baseCell.closest('tr').rowIndex) <= currentTr[0].rowIndex;
                                if (isTopFromRowSpan) {
                                    var newTd = $('<div></div>').append($('<td' + tdAttributes + '>' + dom.blank + '</td>').removeAttr('rowspan')).html();
                                    html.append(newTd);
                                    break;
                                }
                            }
                            var rowspanNumber = parseInt(currentCell.baseCell.rowSpan, 10);
                            rowspanNumber++;
                            currentCell.baseCell.setAttribute('rowSpan', rowspanNumber);
                        }
                            break;
                    }
                }

                if (position === 'top') {
                    currentTr.before(html);
                } else {
                    var cellHasRowspan = (cell.rowSpan > 1);
                    if (cellHasRowspan) {
                        var lastTrIndex = currentTr[0].rowIndex + (cell.rowSpan - 2);
                        $($(currentTr).parent().find('tr')[lastTrIndex]).after($(html));
                        return;
                    }
                    currentTr.after(html);
                }

                self.afterCommand();
            }
        };

        self.jAddCol = function (position) {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var row = $(cell).closest('tr');
                var colgroup = $(row).closest('table').find('colgroup').children('col');
                var tdIndex = row.children().index($(cell));

                var vTable = new TableResultAction(cell, TableResultAction.where.Column,
                    TableResultAction.requestAction.Add, $(row).closest('table')[0]);
                var actions = vTable.getActionList();

                for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                    var currentCell = actions[actionIndex];
                    var tdAttributes = self.recoverAttributes(currentCell.baseCell);
                    switch (currentCell.action) {
                        case TableResultAction.resultAction.AddCell:
                            if (position === 'right') {
                                $(currentCell.baseCell).after('<td' + tdAttributes + '>' + dom.blank + '</td>');
                            } else {
                                $(currentCell.baseCell).before('<td' + tdAttributes + '>' + dom.blank + '</td>');
                            }
                            break;
                        case TableResultAction.resultAction.SumSpanCount:
                            var colspanNumber = parseInt(currentCell.baseCell.colSpan, 10);
                            colspanNumber++;
                            currentCell.baseCell.setAttribute('colSpan', colspanNumber);
                            break;
                    }
                }

                if (colgroup.length) {
                    var baseCol = colgroup[tdIndex];
                    var colAttributes = self.recoverAttributes(baseCol);
                    var $col = $('<col' + colAttributes + '/>');
                    $col.width(100);
                    if (position === 'right') {
                        $(baseCol).after($col[0]);
                    } else {
                        $(baseCol).before($col[0]);
                    }
                }

                self.afterCommand();
            }
        };

        self.jDeleteRow = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var row = $(cell).closest('tr');
                var cellPos = row.children('td, th').index($(cell));
                var rowPos = row[0].rowIndex;


                var vTable = new TableResultAction(cell, TableResultAction.where.Row,
                    TableResultAction.requestAction.Delete, $(row).closest('table')[0]);
                var actions = vTable.getActionList();

                for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                    if (!actions[actionIndex]) {
                        continue;
                    }

                    var baseCell = actions[actionIndex].baseCell;
                    var virtualPosition = actions[actionIndex].virtualTable;
                    var hasRowspan = (baseCell.rowSpan && baseCell.rowSpan > 1);
                    var rowspanNumber = (hasRowspan) ? parseInt(baseCell.rowSpan, 10) : 0;
                    switch (actions[actionIndex].action) {
                        case TableResultAction.resultAction.Ignore:
                            continue;
                        case TableResultAction.resultAction.AddCell: {
                            var nextRow = row.next('tr')[0];
                            if (!nextRow) {
                                continue;
                            }
                            var cloneRow = row[0].cells[cellPos];
                            if (hasRowspan) {
                                if (rowspanNumber > 2) {
                                    rowspanNumber--;
                                    nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                    nextRow.cells[cellPos].setAttribute('rowSpan', rowspanNumber);
                                    nextRow.cells[cellPos].innerHTML = '';
                                } else if (rowspanNumber === 2) {
                                    nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                    nextRow.cells[cellPos].removeAttribute('rowSpan');
                                    nextRow.cells[cellPos].innerHTML = '';
                                }
                            }
                        }
                            continue;
                        case TableResultAction.resultAction.SubtractSpanCount:
                            if (hasRowspan) {
                                if (rowspanNumber > 2) {
                                    rowspanNumber--;
                                    baseCell.setAttribute('rowSpan', rowspanNumber);
                                    if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) {
                                        baseCell.innerHTML = '';
                                    }
                                } else if (rowspanNumber === 2) {
                                    baseCell.removeAttribute('rowSpan');
                                    if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) {
                                        baseCell.innerHTML = '';
                                    }
                                }
                            }
                            continue;
                        case TableResultAction.resultAction.RemoveCell:
                            // Do not need remove cell because row will be deleted.
                            continue;
                    }
                }
                row.remove();

                self.afterCommand();
            }
        };

        self.jDeleteCol = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var row = $(cell).closest('tr');
                var cellPos = row.children('td, th').index($(cell));
                var colgroup = $(row).closest('table').find('colgroup').children('col');
                var tdIndex = row.children().index($(cell));

                var vTable = new TableResultAction(cell, TableResultAction.where.Column,
                    TableResultAction.requestAction.Delete, $(row).closest('table')[0]);
                var actions = vTable.getActionList();

                for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                    if (!actions[actionIndex]) {
                        continue;
                    }
                    switch (actions[actionIndex].action) {
                        case TableResultAction.resultAction.Ignore:
                            continue;
                        case TableResultAction.resultAction.SubtractSpanCount: {
                            var baseCell = actions[actionIndex].baseCell;
                            var hasColspan = (baseCell.colSpan && baseCell.colSpan > 1);
                            if (hasColspan) {
                                var colspanNumber = (baseCell.colSpan) ? parseInt(baseCell.colSpan, 10) : 0;
                                if (colspanNumber > 2) {
                                    colspanNumber--;
                                    baseCell.setAttribute('colSpan', colspanNumber);
                                    if (baseCell.cellIndex === cellPos) {
                                        baseCell.innerHTML = '';
                                    }
                                } else if (colspanNumber === 2) {
                                    baseCell.removeAttribute('colSpan');
                                    if (baseCell.cellIndex === cellPos) {
                                        baseCell.innerHTML = '';
                                    }
                                }
                            }
                        }
                            continue;
                        case TableResultAction.resultAction.RemoveCell:
                            dom.remove(actions[actionIndex].baseCell, true);
                            continue;
                    }
                }

                if (colgroup.length) {
                    var baseCol = colgroup[tdIndex];
                    $(baseCol).remove();
                }

                self.afterCommand();
            }
        };

        self.recoverAttributes = function (el) {
            var resultStr = '';

            if (!el) {
                return resultStr;
            }

            var attrList = el.attributes || [];

            for (var i = 0; i < attrList.length; i++) {
                if (attrList[i].name.toLowerCase() === 'id') {
                    continue;
                }

                if (attrList[i].specified) {
                    resultStr += ' ' + attrList[i].name + '=\'' + attrList[i].value + '\'';
                }
            }

            return resultStr;
        }

        self.beforeCommand = function () {
            modules.editor.beforeCommand.call(modules.editor);
        };
        self.afterCommand = function () {
            modules.editor.afterCommand.call(modules.editor);
        };

        context.memo('button.jTable', function () {
            return ui.buttonGroup([
                ui.button({
                    className: 'dropdown-toggle',
                    contents : ui.dropdownButtonContents(ui.icon(options.icons.table), options),
                    tooltip  : lang.table.table,
                    container: options.container,
                    data     : {
                        toggle: 'dropdown',
                    },
                }),
                ui.dropdown({
                    title    : lang.table.table,
                    className: 'note-table',
                    items    : [
                        '<div class="note-dimension-picker">',
                        '<div class="note-dimension-picker-mousecatcher" data-event="insertTable" data-value="1x1"/>',
                        '<div class="note-dimension-picker-highlighted"/>',
                        '<div class="note-dimension-picker-unhighlighted"/>',
                        '</div>',
                        '<div class="note-dimension-display">1 x 1</div>',
                    ].join(''),
                }),
            ], {
                callback: function ($node) {
                    var $catcher = $node.find('.note-dimension-picker-mousecatcher');
                    $catcher.css({
                        width : options.insertTableMaxSize.col + 'em',
                        height: options.insertTableMaxSize.row + 'em',
                    }).mousedown(context.createInvokeHandler("jTable.insertTable"))
                        .on('mousemove', modules.buttons.tableMoveHandler.bind(context));
                },
            }).render();
        });

        self.insertTable = function (dim) {
            self.beforeCommand();

            var dimension = dim.split('x');
            var rng = modules.editor.getLastRange().deleteContents();
            var tableDivEl = self.createTable(dimension[0], dimension[1], options);
            rng.insertNode(tableDivEl);

            self.afterCommand();
        };

        self.createTable = function (colCount, rowCount, options) {
            var colgroup = [];
            var colgroupHTML;
            var tds = [];
            var tdHTML;

            for (var idxCol = 0; idxCol < colCount; idxCol++) {
                tds.push('<td>' + dom.blank + '</td>');
                colgroup.push('<col style="width: 100px;"/>');
            }
            colgroupHTML = '<colgroup>' + colgroup.join('') + '</colgroup>';
            tdHTML = tds.join('');

            var trs = [];
            var trHTML;
            for (var idxRow = 0; idxRow < rowCount; idxRow++) {
                trs.push('<tr>' + tdHTML + '</tr>');
            }
            trHTML = trs.join('');

            var $table = $('<table style="width: auto !important;">' + colgroupHTML + trHTML + '</table>');
            if (options && options.tableClassName) {
                $table.addClass(options.tableClassName);
            }

            return $table[0];
        };

        context.memo('button.jBorderColor', function () {
            return self.colorPalette('note-color-table-border', lang.jTable.borderColor, self.jBorderColor);
        });

        self.jBorderColor = function (backColor) {
            self.beforeCommand();

            var cell = tableBlock.currentTdEl;
            var $cell = $(cell);
            $cell.closest('table').find('td, th').css('border', '1px solid ' + backColor);

            resetTableBlock($cell);

            self.afterCommand();
        };

        context.memo('button.jBackcolor', function () {
            return self.colorPalette('note-color-back', lang.color.background, self.color);
        });

        self.color = function (backColor) {
            self.beforeCommand();

            var cell = tableBlock.currentTdEl;
            var $cell = $(cell);
            var $table = $cell.closest('table');

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();

            var effectRow = tableBlock.effect.row;
            var effectCol = tableBlock.effect.col;
            for (var rowIndex = effectRow.start; rowIndex <= effectRow.end; rowIndex++) {
                for (var colIndex = effectCol.start; colIndex <= effectCol.end; colIndex++) {
                    var virtualTd = matrixTable[rowIndex][colIndex];
                    $(virtualTd.baseCell).css('background-color', backColor);
                }
            }

            resetTableBlock($cell);

            self.afterCommand();
        };

        self.colorPalette = function (className, tooltip, callbackFnc) {
            return ui.buttonGroup({
                className: 'note-color ' + className,
                children : [
                    ui.button({
                        className: 'note-current-color-button',
                        contents : ui.icon(options.icons.font + ' note-recent-color'),
                        tooltip  : tooltip,
                        container: options.container,
                        click    : function (e) {
                            const $button = $(e.currentTarget);
                            const value = $button.attr('data-backColor');
                            callbackFnc(value);
                        },
                        callback : function ($button) {
                            const $recentColor = $button.find('.note-recent-color');
                            $recentColor.css('background-color', className == 'note-color-table-border' ? '#000000' : options.colorButton.backColor);
                            $button.attr('data-backColor', className == 'note-color-table-border' ? '#000000' : options.colorButton.backColor);
                            $recentColor.css('color', 'transparent');
                        },
                    }),
                    ui.button({
                        className: 'dropdown-toggle',
                        contents : ui.dropdownButtonContents('', options),
                        tooltip  : lang.color.more,
                        container: options.container,
                        data     : {
                            toggle: 'dropdown',
                        },
                    }),
                    ui.dropdown({
                        items   : ([
                            '<div class="note-palette">',
                            '<div class="note-palette-title">' + lang.color.background + '</div>',
                            '<div>',
                            '<button type="button" class="note-color-reset btn btn-light" data-event="backColor" data-value="inherit">',
                            lang.color.transparent,
                            '</button>',
                            '</div>',
                            '<div class="note-holder" data-event="backColor"/>',
                            '<div>',
                            // '<button type="button" class="note-color-select btn btn-light" data-event="openPalette" data-value="backColorPicker">',
                            // lang.color.cpSelect,
                            // '</button>',
                            // '<input type="color" id="backColorPicker" class="note-btn note-color-select-btn" value="' + options.colorButton.backColor + '" data-event="backColorPalette">',
                            // '</div>',
                            // '<div class="note-holder-custom" id="backColorPalette" data-event="backColor"/>',
                            // '</div>',
                        ].join('')),
                        callback: function ($dropdown) {
                            $dropdown.find('.note-holder').each(function (idx, item) {
                                const $holder = $(item);
                                $holder.append(ui.palette({
                                    colors    : options.colors,
                                    colorsName: options.colorsName,
                                    eventName : $holder.data('event'),
                                    container : options.container,
                                    tooltip   : options.tooltip,
                                    container : options.container,
                                }).render());
                            });
                            /* TODO: do we have to record recent custom colors within cookies? */
                            var customColors = [
                                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
                            ];
                            $dropdown.find('.note-holder-custom').each(function (idx, item) {
                                const $holder = $(item);
                                $holder.append(ui.palette({
                                    colors    : customColors,
                                    colorsName: customColors,
                                    eventName : $holder.data('event'),
                                    container : options.container,
                                    tooltip   : options.tooltip,
                                    container : options.container,
                                }).render());
                            });
                            $dropdown.find('input[type=color]').each(function (idx, item) {
                                $(item).change(function () {
                                    const $chip = $dropdown.find('#' + $(this).data('event')).find('.note-color-btn').first();
                                    const color = this.value.toUpperCase();
                                    $chip.css('background-color', color)
                                        .attr('aria-label', color)
                                        .attr('data-value', color)
                                        .attr('data-original-title', color);
                                    $chip.click();
                                });
                            });
                        },
                        click   : function (event) {
                            // event.stopPropagation();

                            const $parent = $(this).closest('.note-popover').find('.note-dropdown-menu');
                            const $button = $(event.target);
                            const eventName = $button.data('event');
                            const value = $button.attr('data-value');

                            if (eventName === 'openPalette') {
                                const $picker = $parent.find('#' + value);
                                const $palette = $($parent.find('#' + $picker.data('event')).find('.note-color-row')[0]);

                                // Shift palette chips
                                const $chip = $palette.find('.note-color-btn').last().detach();

                                // Set chip attributes
                                const color = $picker.val();
                                $chip.css('background-color', color)
                                    .attr('aria-label', color)
                                    .attr('data-value', color)
                                    .attr('data-original-title', color);
                                $palette.prepend($chip);
                                $picker.click();
                            } else {
                                // eventName == 'backColor'
                                const key = eventName === 'backColor' ? 'background-color' : 'color';
                                const $color = $button.closest('.note-color').find('.note-recent-color');
                                const $currentButton = $button.closest('.note-color').find('.note-current-color-button');

                                $color.css(key, value);
                                $currentButton.attr('data-' + eventName, value);
                                callbackFnc(value);
                            }
                        },
                    }),
                ],
            }).render();
        };

        self.setCellHorizontalAlign = function (position) {
            self.beforeCommand();

            var cell = tableBlock.currentTdEl;
            var $cell = $(cell);
            var $table = $cell.closest('table');

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();

            var effectRow = tableBlock.effect.row;
            var effectCol = tableBlock.effect.col;
            for (var rowIndex = effectRow.start; rowIndex <= effectRow.end; rowIndex++) {
                for (var colIndex = effectCol.start; colIndex <= effectCol.end; colIndex++) {
                    var virtualTd = matrixTable[rowIndex][colIndex];
                    $(virtualTd.baseCell).css('text-align', position);
                }
            }

            resetTableBlock($cell);

            self.afterCommand();
        };

        self.setCellVerticalAlign = function (position) {
            self.beforeCommand();

            var cell = tableBlock.currentTdEl;
            var $cell = $(cell);
            var $table = $cell.closest('table');

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();

            var effectRow = tableBlock.effect.row;
            var effectCol = tableBlock.effect.col;
            for (var rowIndex = effectRow.start; rowIndex <= effectRow.end; rowIndex++) {
                for (var colIndex = effectCol.start; colIndex <= effectCol.end; colIndex++) {
                    var virtualTd = matrixTable[rowIndex][colIndex];
                    $(virtualTd.baseCell).css('vertical-align', position);
                }
            }

            resetTableBlock($cell);

            self.afterCommand();
        };

        var horizontal = [
            ui.button({
                contents : ui.icon(options.icons.alignLeft),
                tooltip  : lang.paragraph.left,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellHorizontalAlign', 'left'),
            }),
            ui.button({
                contents : ui.icon(options.icons.alignCenter),
                tooltip  : lang.paragraph.center,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellHorizontalAlign', 'center'),
            }),
            ui.button({
                contents : ui.icon(options.icons.alignRight),
                tooltip  : lang.paragraph.right,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellHorizontalAlign', 'right'),
            }),
            ui.button({
                contents : ui.icon(options.icons.alignJustify),
                tooltip  : lang.paragraph.justify,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellHorizontalAlign', 'justify'),
            })
        ];
        var vertical = [
            ui.button({
                className: 'jtable-vertical-align-btn-top',
                contents : ui.icon(options.icons.alignJustify),
                tooltip  : lang.jTable.align.top,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellVerticalAlign', 'top'),
            }),
            ui.button({
                className: 'jtable-vertical-align-btn-middle',
                contents : ui.icon(options.icons.alignJustify),
                tooltip  : lang.jTable.align.middle,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellVerticalAlign', 'middle'),
            }),
            ui.button({
                className: 'jtable-vertical-align-btn-bottom',
                contents : ui.icon(options.icons.alignJustify),
                tooltip  : lang.jTable.align.bottom,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellVerticalAlign', 'bottom'),
            }),
            ui.button({
                className: 'jtable-vertical-align-btn-baseline',
                contents : ui.icon(options.icons.alignJustify),
                tooltip  : lang.jTable.align.baseline,
                container: options.container,
                click    : context.createInvokeHandler('jTable.setCellVerticalAlign', 'baseline'),
            })
        ];

        context.memo('button.jAlign', function () {
            return ui.buttonGroup([
                ui.button({
                    className: 'dropdown-toggle',
                    contents : ui.dropdownButtonContents(ui.icon(options.icons.alignLeft), options),
                    tooltip  : lang.paragraph.paragraph,
                    container: options.container,
                    data     : {
                        toggle: 'dropdown',
                    },
                }),
                ui.dropdown({
                    className: 'jtable-align-dropdown',
                    children : [
                        ui.buttonGroup({
                            className: 'jtable-horizontal-align-button-group',
                            children : horizontal,
                        }),
                        ui.buttonGroup({
                            className: 'jtable-vertical-align-button-group',
                            children : vertical,
                        })
                    ]
                }),
            ], {
                callback: function ($node) {
                    // console.log($node);
                },
            }).render();
        });


        var mergeBody = [
            '<div class="form-group">',
            '<label for="jtable-cell-merge-col' + options.id + '" class="note-form-label jtable-merge-label">' + lang.jTable.merge.colspan + '</label>',
            '<input id="jtable-cell-merge-col' + options.id + '" class="note-input jtable-merge-input jtable-merge-col-input" type="number" name="col"/>',
            '<span class="jtable-merge-hint-span">(min : <span class="jtable-merge-hint-col-min">1</span> / max : <span class="jtable-merge-hint-col-max">1</span>)</span>',
            '</div>',
            '<div class="form-group jtable-merge-row-info-div">',
            '<label for="jtable-cell-merge-row' + options.id + '" class="note-form-label jtable-merge-label">' + lang.jTable.merge.rowspan + '</label>',
            '<input id="jtable-cell-merge-row' + options.id + '" class="note-input jtable-merge-input jtable-merge-row-input" type="number" name="row"/>',
            '<span class="jtable-merge-hint-span">(min : <span class="jtable-merge-hint-row-min">1</span> / max : <span class="jtable-merge-hint-row-max">1</span>)</span>',
            '</div>',
        ].join('');
        var mergeFooter = '<input type="button" href="#" class="btn btn-primary note-btn note-btn-primary jtable-merge-btn" value="' + lang.jTable.merge.merge + '" disabled>';

        $mergeDialog = ui.dialog({
            title : lang.jTable.merge.merge,
            fade  : options.dialogsFade,
            body  : mergeBody,
            footer: mergeFooter,
        }).render().appendTo(options.container);
        $mergeDialog.find('.note-modal-content').width(340);
        $mergeDialog.find('.note-modal-body').css('padding', '20px 20px 10px 20px');

        var cellSplit = [
            ui.button({
                className: 'note-btn-jtable-cell-split',
                contents : ui.icon('note-icon-table-cell-split'),
                tooltip  : lang.jTable.merge.split,
                container: options.container,
                click    : context.createInvokeHandler('jTable.cellSplit'),
            }),
        ];

        context.memo('button.jMerge', function () {
            return ui.buttonGroup({
                children: [
                    ui.button({
                        contents : ui.icon('note-icon-table-merge'),
                        tooltip  : lang.jTable.merge.merge,
                        container: options.container,
                        click    : context.createInvokeHandler('jTable.cellMerge'),
                    }),
                    ui.button({
                        className: 'dropdown-toggle jtable-cell-split-dropdown-toggle',
                        contents : ui.dropdownButtonContents('', options),
                        tooltip  : lang.jTable.merge.split,
                        container: options.container,
                        data     : {
                            toggle: 'dropdown',
                        },
                        click    : function (event) {
                            var $parent = $(this).parent();
                            var $cellSplitBtn = $parent.find('.note-btn-jtable-cell-split');

                            var cellHasSpan = false;

                            var rng = modules.editor.getLastRange.call(modules.editor);
                            if (rng.isCollapsed() && rng.isOnCell()) {
                                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                                cellHasSpan = (cell.rowSpan > 1) || (cell.colSpan > 1);
                            }

                            $cellSplitBtn.toggleClass('disabled', !cellHasSpan);
                            $cellSplitBtn.attr('disabled', !cellHasSpan);
                        },
                    }),
                    ui.dropdown({
                        className: 'jtable-cell-split-dropdown',
                        children : [
                            ui.buttonGroup({
                                className: 'jtable-cell-split-button-group',
                                children : cellSplit,
                            })
                        ]
                    }),
                ],
            }).render();
        });

        self.cellMerge = function () {
            if(options.jTable.mergeMode == 'drag') {
                self.dragCellMerge();
            } else {
                self.mergeDialogShow();
            }
        };

        self.dragCellMerge = function () {
            var cell = tableBlock.currentTdEl;
            var $cell = $(cell);
            var $table = $cell.closest('table');

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();

            var effectRow = tableBlock.effect.row;
            var effectCol = tableBlock.effect.col;

            if(effectRow.start == effectRow.end && effectCol.start == effectCol.end){
                resetTableBlock($cell);
                return true;
            }

            for (var rowIndex = effectRow.start; rowIndex <= effectRow.end; rowIndex++) {
                for (var colIndex = effectCol.start; colIndex <= effectCol.end; colIndex++) {
                    var virtualTd = matrixTable[rowIndex][colIndex];
                    cellUnMerge(virtualTd.baseCell);
                }
            }

            var cellData = getMergeCellData(cell);

            var data = {
                trIndex : cellData.trIndex,
                colIndex: cellData.colIndex,
                current : {
                    col: cellData.current.col,
                    row: cellData.current.row,
                },
                merge   : {
                    col: parseInt(effectCol.end - effectCol.start + 1, 10),
                    row: parseInt(effectRow.end - effectRow.start + 1, 10),
                },
                effect  : {
                    col: cellData.effect.col,
                    row: cellData.effect.row,
                },
            };

            var mergeCell = matrixTable[effectRow.start][effectCol.start];
            tableCellMerge(mergeCell.baseCell, data);

            resetTableBlock($cell);


        };

        self.mergeDialogShow = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var cellData = getMergeCellData(cell);
                modules.tablePopover.hide();
                context.invoke('editor.saveRange');
                showMergeDialog(cellData).then(function (data) {
                    // [workaround] hide dialog before restore range for IE range focus
                    ui.hideDialog($mergeDialog);
                    context.invoke('editor.restoreRange');

                    var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                    tableCellMerge(cell, data);

                }).fail(function () {
                    context.invoke('editor.restoreRange');
                });
            }
        };

        function tableCellMerge(cell, data) {
            var $cell = $(cell);
            var colRemoveCount = data.merge.col - data.current.col;
            var rowRemoveCount = data.merge.row - data.current.row;

            $cell.prop("colspan", data.merge.col);

            for (var i = 0; i < colRemoveCount; i++) {
                $(data.effect.col[i]).remove();
            }

            $cell.prop("rowspan", data.merge.row);
            for (var i = 0; i < rowRemoveCount; i++) {
                var effectCell = data.effect.row[i];
                if (colRemoveCount > 0) {
                    for (var j = 0; j < colRemoveCount; j++) {
                        $(effectCell).next().remove();
                    }
                }
                $(effectCell).remove();
            }

            var $table = $cell.closest('table');
            var $trList = $table.children('tr');
            if(!$trList.length) $trList = $table.children('tbody').children('tr');
            for(var i = 0; i < $trList.length; i++) {
                var $tr = $($trList[i]);
                var $cellList = $tr.find('td, th');
                if(!$cellList.length)   $tr.remove();
                console.log('aaaaaaaaa');
            }
        }

        function showMergeDialog(cellData) {
            return $.Deferred(function (deferred) {
                var $spanCountInput = $mergeDialog.find('.jtable-merge-input');
                var $colInput = $mergeDialog.find('.jtable-merge-col-input');
                var $colMinSapn = $mergeDialog.find('.jtable-merge-hint-col-min');
                var $colMaxSapn = $mergeDialog.find('.jtable-merge-hint-col-max');

                var $rowInput = $mergeDialog.find('.jtable-merge-row-input');
                var $rowMinSapn = $mergeDialog.find('.jtable-merge-hint-row-min');
                var $rowMaxSapn = $mergeDialog.find('.jtable-merge-hint-row-max');

                var $mergeBtn = $mergeDialog.find('.jtable-merge-btn');

                $colInput.val(cellData.current.col);
                $colMinSapn.text(cellData.current.col);
                $colMaxSapn.text(cellData.max.col);

                $rowInput.val(cellData.current.row);
                $rowMinSapn.text(cellData.current.row);
                $rowMaxSapn.text(cellData.max.row);

                ui.onDialogShown($mergeDialog, function () {
                    context.triggerEvent('dialog.shown');

                    $spanCountInput.on('input paste propertychange', function () {
                        var toggleBtnFlag = false;
                        var col = parseInt($colInput.val(), 10);
                        var row = parseInt($rowInput.val(), 10);

                        if (col == cellData.current.col && row == cellData.current.row) {
                            toggleBtnFlag = false;
                        } else if (col >= cellData.current.col && col <= cellData.max.col
                            && row >= cellData.current.row && row <= cellData.max.row) {
                            toggleBtnFlag = true;
                        }

                        ui.toggleBtn($mergeBtn, toggleBtnFlag);
                    });

                    $mergeBtn.click(function (event) {
                        event.preventDefault();
                        deferred.resolve({
                            trIndex : cellData.trIndex,
                            colIndex: cellData.colIndex,
                            current : {
                                col: cellData.current.col,
                                row: cellData.current.row,
                            },
                            merge   : {
                                col: parseInt($colInput.val(), 10),
                                row: parseInt($rowInput.val(), 10),
                            },
                            effect  : {
                                col: cellData.effect.col,
                                row: cellData.effect.row,
                            },
                        });
                    });

                    // bindEnterKey($imageUrl, $imageBtn);
                });

                ui.onDialogHidden($mergeDialog, function () {
                    $spanCountInput.off();
                    $mergeBtn.off();
                    ui.toggleBtn($mergeBtn, false);

                    if (deferred.state() === 'pending') {
                        deferred.reject();
                    }
                });

                ui.showDialog($mergeDialog);
            });
        }

        self.cellSplit = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                cellUnMerge(cell);

                self.afterCommand();
            }
        };

        function cellUnMerge(cell){
            var $cell = $(cell);

            var $table = $cell.closest('table');
            var $tr = $cell.closest('tr');
            var currentColspan = parseInt(cell.colSpan, 10);
            var currentRowspan = parseInt(cell.rowSpan, 10);
            var insertColTdCount = currentColspan - 1;
            var startTrIndex = $tr[0].rowIndex;
            var endTrIndex = startTrIndex + currentRowspan - 1;

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();
            var colCount = vTable.getColCount();

            var insertFlag = false;
            var targetCell = [];
            for (var rowIndex = startTrIndex; rowIndex <= endTrIndex; rowIndex++) {
                var row = matrixTable[rowIndex];
                for (var colIndex = 0; colIndex < row.length; colIndex++) {
                    if (insertFlag && cell != row[colIndex].baseCell && !row[colIndex].isVirtual) {
                        targetCell.push(row[colIndex].baseCell);
                        if (rowIndex == startTrIndex) {
                            for (var i = 0; i < insertColTdCount; i++) {
                                $(row[colIndex].baseCell).before($('<td/>'))
                            }
                        } else {
                            for (var i = 0; i < currentColspan; i++) {
                                $(row[colIndex].baseCell).before($('<td/>'))
                            }
                        }
                        break;
                    }
                    if (cell == row[colIndex].baseCell) {
                        insertFlag = true;
                    }
                    if (insertFlag && colIndex == row.length - 1) {
                        var baseCell = row[colIndex].baseCell;
                        // current Cell is last Cell
                        if (rowIndex == startTrIndex) {
                            for (var i = 0; i < insertColTdCount; i++) {
                                $(baseCell).after($('<td/>'))
                            }
                        } else {
                            var $trList = $table.children('tr');
                            if(!$trList.length) $trList = $trList.children('tbody').children('tr');
                            baseCell = $($trList[rowIndex]).children().last();
                            for (var i = 0; i < currentColspan; i++) {
                                $(baseCell).after($('<td/>'))
                            }
                        }
                    }
                }
                insertFlag = false;
            }

            $cell.prop("colspan", 1);
            $cell.prop("rowspan", 1);
        }

        function getMergeCellData(cell) {
            var $table = $(cell).closest('table');
            var $tr = $(cell).closest('tr');
            var trIndex = $tr[0].rowIndex;

            var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
            var matrixTable = vTable.getMatrixTable();

            var tdList = matrixTable[trIndex];
            var tdIndex = 0;
            var countFlag = false;
            var maxCol = 1;
            var effectCol = [];

            if (cell.rowSpan > 1) {
                maxCol = cell.colSpan;
            } else {
                for (var colIndex = 0; colIndex < tdList.length; colIndex++) {
                    var virtualTd = tdList[colIndex];
                    if (countFlag) {
                        effectCol.push(virtualTd.baseCell);
                        maxCol++;
                    }
                    if (!countFlag && cell == virtualTd.baseCell) {
                        tdIndex = colIndex;
                        countFlag = true;
                    } else if (countFlag && (virtualTd.baseCell.colSpan > 1 || virtualTd.baseCell.rowSpan > 1)) {
                        maxCol--;
                        effectCol.pop();
                        countFlag = false;
                    }
                }
            }

            countFlag = false;
            var maxRow = 1;
            var effectRow = [];

            if (cell.colSpan > 1) {
                maxRow = cell.rowSpan;
            } else {
                for (var rowIndex = 0; rowIndex < matrixTable.length; rowIndex++) {
                    var virtualTd = matrixTable[rowIndex][tdIndex];
                    if (countFlag) {
                        effectRow.push(virtualTd.baseCell);
                        maxRow++;
                    }
                    if (!countFlag && cell == virtualTd.baseCell) {
                        countFlag = true;
                    } else if (countFlag && (virtualTd.baseCell.colSpan > 1 || virtualTd.baseCell.rowSpan > 1)) {
                        maxRow--;
                        effectRow.pop();
                        countFlag = false;
                    }
                }
            }

            return {
                trIndex: trIndex,
                tdIndex: tdIndex,
                current: {
                    col: cell.colSpan,
                    row: cell.rowSpan,
                },
                max    : {
                    col: maxCol,
                    row: maxRow,
                },
                effect : {
                    col: effectCol,
                    row: effectRow,
                },
            };
        }


        var tableInfoBody = [
            '<div class="form-group form-group-jtable-table-info-margin">',
            '<div class="jtable-table-info-margin-top-bottom"><input type="number" value="0" class="jtable-table-info-margin-input jtable-table-info-margin-input-top"><span>px</span></div>',
            '<div class="jtable-table-info-margin-middle">',
            '<div class="jtable-table-info-margin-left"><input type="number" value="0" class="jtable-table-info-margin-input jtable-table-info-margin-input-left"><span>px</span></div>',
            '<div class="jtable-table-info-margin-center"><b>Table</b><br><span class="jtable-table-info-width">0</span> X <span class="jtable-table-info-height">0</span></div>',
            '<div class="jtable-table-info-margin-right"><input type="number" value="0" class="jtable-table-info-margin-input jtable-table-info-margin-input-right"><span>px</span></div>',
            '</div>',
            '<div class="jtable-table-info-margin-top-bottom"><input type="number" value="0" class="jtable-table-info-margin-input jtable-table-info-margin-input-bottom"><span>px</span></div>',
            '</div>',
        ].join('');
        var tableInfoFooter = '<input type="button" href="#" class="btn btn-primary note-btn note-btn-primary jtable-apply-btn" value="' + lang.jTable.apply + '" >';

        $tableInfoDialog = ui.dialog({
            title : lang.table.table + ' ' + lang.jTable.info.margin,
            fade  : options.dialogsFade,
            body  : tableInfoBody,
            footer: tableInfoFooter,
        }).render().appendTo(options.container);
        // $tableInfoDialog.find('.note-modal-content').width(340);
        $tableInfoDialog.find('.note-modal-body').css('padding', '20px 20px 10px 20px');

        context.memo('button.jTableInfo', function () {
            return ui.button({
                contents : ui.icon('note-icon-table-margin'),
                tooltip  : lang.table.table + ' ' + lang.jTable.info.margin,
                container: options.container,
                click    : context.createInvokeHandler('jTable.tableInfoDialogShow'),
            }).render();
        });

        self.tableInfoDialogShow = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var $table = $(cell).closest('table');

                modules.tablePopover.hide();

                showTableInfoDialog($table).then(function (data) {
                    // [workaround] hide dialog before restore range for IE range focus
                    ui.hideDialog($tableInfoDialog);
                    context.invoke('editor.restoreRange');

                    $table.css('margin', data.join(' '))

                }).fail(function () {
                    context.invoke('editor.restoreRange');
                });
            }
        };

        function showTableInfoDialog($table) {
            return $.Deferred(function (deferred) {
                var $applyBtn = $tableInfoDialog.find('.jtable-apply-btn');
                var $marginInput = $tableInfoDialog.find('.jtable-table-info-margin-input');
                var $marginTopInput = $tableInfoDialog.find('.jtable-table-info-margin-input-top');
                var $marginLeftInput = $tableInfoDialog.find('.jtable-table-info-margin-input-left');
                var $marginRightInput = $tableInfoDialog.find('.jtable-table-info-margin-input-right');
                var $marginBottomInput = $tableInfoDialog.find('.jtable-table-info-margin-input-bottom');

                var $tableWidthtSpan = $tableInfoDialog.find('.jtable-table-info-width');
                var $tableHeightSpan = $tableInfoDialog.find('.jtable-table-info-height');

                $marginTopInput.val(parseInt($table.css('margin-top'), 10));
                $marginLeftInput.val(parseInt($table.css('margin-left'), 10));
                $marginRightInput.val(parseInt($table.css('margin-right'), 10));
                $marginBottomInput.val(parseInt($table.css('margin-bottom'), 10));

                $tableWidthtSpan.text($table.width());
                $tableHeightSpan.text($table.height());

                ui.onDialogShown($tableInfoDialog, function () {
                    context.triggerEvent('dialog.shown');

                    $marginInput.on('input paste propertychange', function () {
                        var toggleBtnFlag = true;
                        var top = parseInt($marginTopInput.val(), 10);
                        var left = parseInt($marginLeftInput.val(), 10);
                        var right = parseInt($marginRightInput.val(), 10);
                        var bottom = parseInt($marginBottomInput.val(), 10);

                        if (top < 0 || left < 0 || right < 0 || bottom < 0) {
                            toggleBtnFlag = false;
                        }

                        ui.toggleBtn($applyBtn, toggleBtnFlag);
                    });

                    $applyBtn.click(function (event) {
                        event.preventDefault();

                        deferred.resolve([
                            parseInt($marginTopInput.val(), 10) + 'px',
                            parseInt($marginRightInput.val(), 10) + 'px',
                            parseInt($marginBottomInput.val(), 10) + 'px',
                            parseInt($marginLeftInput.val(), 10) + 'px'
                        ]);
                    });

                });

                ui.onDialogHidden($mergeDialog, function () {
                    $marginInput.off();
                    $applyBtn.off();
                    ui.toggleBtn($applyBtn, false);

                    if (deferred.state() === 'pending') {
                        deferred.reject();
                    }
                });

                ui.showDialog($tableInfoDialog);
            });
        }

        context.memo('button.jWidthHeightReset', function () {
            return ui.button({
                contents : ui.icon('note-icon-table-width-height-reset'),
                tooltip  : lang.table.table + ' ' + lang.jTable.areaReset,
                container: options.container,
                click    : context.createInvokeHandler('jTable.jWidthHeightReset'),
            }).render();
        });

        self.jWidthHeightReset = function () {
            var rng = modules.editor.getLastRange.call(modules.editor);
            if (rng.isCollapsed() && rng.isOnCell()) {
                self.beforeCommand();

                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var $table = $(cell).closest('table');
                $table.removeAttr('width');
                $table.removeAttr('height');
                $table.css('width', 'auto');
                $table.css('height', '');

                var $cell = $table.find('tr, td, th');
                $cell.removeAttr('width');
                $cell.removeAttr('height');
                $cell.css('width', '');
                $cell.css('height', '');

                var vTable = new TableResultAction(cell, undefined, undefined, $table[0]);
                var colCount = vTable.getColCount();

                $table.find('colgroup:first').remove();
                var $colgroup = $('<colgroup/>');
                for (var colIndex = 0; colIndex < colCount; colIndex++) {
                    $colgroup.append('<col style="width: 100px;"/>');
                }
                $table.prepend($colgroup);

                self.afterCommand();
            }
        };


        self.events = {
            'summernote.init': function (_, layoutInfo) {
                layoutInfo.editingArea.append('<div class="jtable-block"><div/>');

                layoutInfo.editingArea.on('click', '.note-editable table', function (event) {
                    var $target = $(event.target).closest('td');
                    if (!$target.length) $target = $(event.target).closest('th');
                    if ($target.length) modules.tablePopover.update($target[0]);
                });
                layoutInfo.editingArea.on('mousedown', 'td', function (event) {
                    if (tableBlock.pressed) return true;
                    var $this = $(this);
                    resetTableBlock($this);

                    if (tableResize.pressed) return true;

                    var $table = $this.closest('table');
                    var targetTop = $this.offset().top;
                    var targetLeft = $this.offset().left;
                    var targetWidth = $this.outerWidth();
                    var targetHeight = $this.outerHeight();
                    var targetRight = targetLeft + targetWidth;
                    var targetBottom = targetTop + targetHeight;

                    var cellPosition = getCellPosition(this, $table[0]);

                    tableBlock = {
                        pressed          : true,
                        currentTableEl   : $table[0],
                        currentTdEl      : this,
                        currentTdLeft    : targetLeft,
                        currentTdRight   : targetRight,
                        currentTdTop     : targetTop,
                        currentTdBottom  : targetBottom,
                        currentTdPosition: {
                            row: cellPosition.row,
                            col: cellPosition.col,
                        },
                        width            : targetRight,
                        height           : targetBottom,
                        top              : targetTop,
                        left             : targetLeft,
                        effect           : {
                            row: {
                                start: cellPosition.row,
                                end  : cellPosition.row,
                            },
                            col: {
                                start: cellPosition.col,
                                end  : cellPosition.col,
                            },
                        },
                    };

                    event.stopPropagation();
                });
                layoutInfo.editingArea.on('mousemove', '.note-editable', function (event) {
                    if (!tableBlock.pressed) return true;
                    modules.tablePopover.hide();

                    var $this = $(event.target).closest('td');
                    if (!$this.length) $this = $(event.target).closest('th');
                    var $block = $this.closest('.note-editing-area').find('.jtable-block');
                    if ($this.length) {
                        var $table = $this.closest('table');
                        var targetTop = $this.offset().top;
                        var targetLeft = $this.offset().left;
                        var targetWidth = $this.outerWidth();
                        var targetHeight = $this.outerHeight();
                        var targetRight = targetLeft + targetWidth;
                        var targetBottom = targetTop + targetHeight;

                        var cellPosition = getCellPosition($this[0], $table[0]);

                        var colPos = tableBlock.effect.col;
                        var rowPos = tableBlock.effect.row;

                        if (tableBlock.currentTdLeft >= targetLeft) {
                            tableBlock.left = targetLeft;
                            tableBlock.width = tableBlock.currentTdRight - targetLeft;
                            colPos.end = tableBlock.currentTdPosition.col;
                            colPos.start = cellPosition.col;
                        } else {
                            tableBlock.width = targetRight - tableBlock.left;
                            colPos.end = cellPosition.col;
                        }

                        if (tableBlock.currentTdTop >= targetTop) {
                            tableBlock.top = targetTop;
                            tableBlock.height = tableBlock.currentTdBottom - targetTop;
                            rowPos.end = tableBlock.currentTdPosition.row;
                            rowPos.start = cellPosition.row;
                        } else {
                            tableBlock.height = targetBottom - tableBlock.top;
                            rowPos.end = cellPosition.row;
                        }

                        $block.show();
                        $block.offset({
                            left: tableBlock.left,
                            top : tableBlock.top,
                        });
                        $block.css({
                            width : tableBlock.width,
                            height: tableBlock.height,
                        });

                    }
                });
                layoutInfo.editingArea.on('mousemove mousedown touchstart', '.note-editable', function (event) {
                    if (!tableBlock.pressed) return true;
                    event.preventDefault();
                });
                layoutInfo.editingArea.on('mouseup', '.note-editable', function (event) {
                    if (!tableBlock.pressed) return true;
                    tableBlock.pressed = false;

                    var $target = $(event.target).closest('td');
                    if (!$target.length) $target = $(event.target).closest('th');
                    if ($target.length) modules.tablePopover.update($target[0]);
                });
                layoutInfo.editingArea.on('mousedown', 'td', function (event) {
                    var $this = $(this);
                    var $table = $this.closest('table');
                    var $tr = $this.closest('tr');
                    var targetLeft = $this.offset().left;
                    var targetWidth = $this.outerWidth();
                    var targetRight = targetLeft + targetWidth;
                    var targetTop = $tr.offset().top;
                    var targetHeight = $this.outerHeight();
                    var targetBottom = targetTop + targetHeight;

                    var rightFlag = false;
                    if (targetRight - 5 <= event.pageX) {
                        rightFlag = true;
                    }
                    var bottomFlag = false;
                    if (targetBottom - 5 <= event.pageY) {
                        bottomFlag = true;
                    }

                    var contenteditable = $this.closest('.note-editable').prop('contenteditable');

                    if (!rightFlag && !bottomFlag) {
                        resetTableResizeCursor($this, contenteditable);
                        resetTableResize();
                        return;
                    }

                    modules.tablePopover.hide();

                    var cursor;
                    if (rightFlag && bottomFlag) {
                        cursor = 'move';
                    } else if (rightFlag) {
                        cursor = 'col-resize';
                    } else {
                        cursor = 'row-resize';
                    }

                    $this.closest('.note-editing-area').css('cursor', cursor);
                    $this.closest('.note-editable').removeAttr('contenteditable');

                    var vTable = new TableResultAction(this, undefined, undefined, $table[0]);
                    var virtualTable = vTable.getVirtualTable();

                    var trIndex = $tr[0].rowIndex;

                    var cellHasColspan = (this.colSpan > 1);
                    var tdList = virtualTable[trIndex];
                    for (var colIndex = 0; colIndex < tdList.length; colIndex++) {
                        var virtualTd = tdList[colIndex];
                        if (this == virtualTd.baseCell) break;
                    }
                    if (cellHasColspan) {
                        colIndex += this.colSpan - 1;
                    }

                    var firstTdEl = virtualTable[0][colIndex].baseCell;
                    var colEl = $table.find('colgroup:first col')[colIndex];
                    var startWidth = $this.width();
                    if (colEl) {
                        startWidth = $(colEl).width();
                    }

                    tableResize = {
                        pressed        : true,
                        rightFlag      : rightFlag,
                        bottomFlag     : bottomFlag,
                        currentTableEl : $table[0],
                        currentTrEl    : $tr[0],
                        firstTdEl      : firstTdEl,
                        colEl          : colEl,
                        currentTdEl    : this,
                        currentTdLeft  : targetLeft,
                        currentTdRight : targetRight,
                        currentTdTop   : targetTop,
                        currentTdBottom: targetBottom,
                        startX         : event.pageX,
                        startWidth     : startWidth,
                        startY         : event.pageY,
                        startHeight    : $this.height(),
                        contenteditable: contenteditable
                    };

                    resetTableBlock($this);

                    event.stopPropagation();
                });
                layoutInfo.editingArea.on('mousemove', '.note-editable', function (event) {
                    if (!tableResize.pressed) return true;
                    var $this = $(this);
                    var targetLeft = tableResize.currentTdLeft;
                    var targetTop = tableResize.currentTdTop;

                    if (tableResize.rightFlag) {
                        if (!(targetLeft + 1 <= event.pageX)) {
                            resetTableResizeCursor($this, tableResize.contenteditable);
                            resetTableResize();
                            return true;
                        }

                        var resizeTargetEl = tableResize.firstTdEl;
                        if (tableResize.colEl) {
                            resizeTargetEl = tableResize.colEl;
                        }
                        var width = tableResize.startWidth + (event.pageX - tableResize.startX);
                        execTableResize('width', $(resizeTargetEl), width);
                    }

                    if (tableResize.bottomFlag) {
                        if (!(targetTop + 1 <= event.pageY)) {
                            resetTableResizeCursor($this, tableResize.contenteditable);
                            resetTableResize();
                            return true;
                        }

                        var resizeTargetEl = tableResize.currentTrEl;
                        var height = tableResize.startHeight + (event.pageY - tableResize.startY);
                        execTableResize('height', $(resizeTargetEl), height);
                    }

                });
                layoutInfo.editingArea.on('mousemove mousedown touchstart', '.note-editable', function (event) {
                    if (!tableResize.pressed) return true;
                    event.preventDefault();
                });
                layoutInfo.editingArea.on('mouseup', '.note-editable', function (event) {
                    if (!tableResize.pressed) return true;
                    resetTableResizeCursor($(this), tableResize.contenteditable);
                    resetTableResize();
                });
            }
        };

        self.initialize = function () {
        };

        self.destroy = function () {
            ui.hideDialog($mergeDialog);
            $mergeDialog.remove();

            ui.hideDialog($tableInfoDialog);
            $tableInfoDialog.remove();
        };


        function execTableResize(type, $resizeTargetEl, size) {
            switch (type) {
                case 'width':
                    $resizeTargetEl.width(size);
                    break;
                case 'height':
                    $resizeTargetEl.children().height(size);
                    break;
            }
        }

        function resetTableResizeCursor($this, contenteditable) {
            $this.closest('.note-editing-area').css('cursor', 'auto');
            $this.closest('.note-editable').prop('contenteditable', contenteditable);
        }

        function resetTableResize() {
            tableResize = {
                pressed        : false,
                rightFlag      : false,
                bottomFlag     : false,
                currentTableEl : undefined,
                firstTdEl      : undefined,
                colEl          : undefined,
                currentTdEl    : undefined,
                currentTdLeft  : undefined,
                currentTdRight : undefined,
                currentTdTop   : undefined,
                currentTdBottom: undefined,
                startX         : undefined,
                startWidth     : undefined,
                startY         : undefined,
                startHeight    : undefined,
                contenteditable: false
            };
        }

        function resetTableBlock($this) {
            tableBlock = {
                pressed          : false,
                currentTableEl   : undefined,
                currentTdEl      : undefined,
                currentTdLeft    : undefined,
                currentTdRight   : undefined,
                currentTdTop     : undefined,
                currentTdBottom  : undefined,
                currentTdPosition: {
                    row: undefined,
                    col: undefined,
                },
                width            : undefined,
                height           : undefined,
                top              : undefined,
                left             : undefined,
                effect           : {
                    row: {
                        start: undefined,
                        end  : undefined,
                    },
                    col: {
                        start: undefined,
                        end  : undefined,
                    },
                },
            };

            var $block = $this.closest('.note-editing-area').find('.jtable-block');
            $block.hide();
        }

        function getCellPosition(cellEl, tableEl) {
            var vTable = new TableResultAction(cellEl, undefined, undefined, tableEl);
            var matrixTable = vTable.getMatrixTable();
            for (var rowIndex = 0; rowIndex < matrixTable.length; rowIndex++) {
                var virtualTr = matrixTable[rowIndex];
                for (var colIndex = 0; colIndex < virtualTr.length; colIndex++) {
                    var virtualTd = matrixTable[rowIndex][colIndex];
                    if (virtualTd.baseCell == cellEl) {
                        return {
                            row: rowIndex,
                            col: colIndex,
                        };
                    }
                }

            }
        }

    };
    // add table / table col resize end


    // 'TableResultAction' copy 'summernote-0.8.16\src\js\base\editing\Table.js'
    /**
     * @class Create a virtual table to create what actions to do in change.
     * @param {object} startPoint Cell selected to apply change.
     * @param {enum} where  Where change will be applied Row or Col. Use enum: TableResultAction.where
     * @param {enum} action Action to be applied. Use enum: TableResultAction.requestAction
     * @param {object} domTable Dom element of table to make changes.
     */
    var TableResultAction = function (startPoint, where, action, domTable) {
        const _startPoint = {'colPos': 0, 'rowPos': 0};
        const _virtualTable = [];
        const _actionCellList = [];
        const _matrixTable = [];

        /// ///////////////////////////////////////////
        // Private functions
        /// ///////////////////////////////////////////

        /**
         * Set the startPoint of action.
         */
        function setStartPoint() {
            if (!startPoint || !startPoint.tagName || (startPoint.tagName.toLowerCase() !== 'td' && startPoint.tagName.toLowerCase() !== 'th')) {
                // Impossible to identify start Cell point
                return;
            }
            _startPoint.colPos = startPoint.cellIndex;
            if (!startPoint.parentElement || !startPoint.parentElement.tagName || startPoint.parentElement.tagName.toLowerCase() !== 'tr') {
                // Impossible to identify start Row point
                return;
            }
            _startPoint.rowPos = startPoint.parentElement.rowIndex;
        }

        /**
         * Define virtual table position info object.
         *
         * @param {int} rowIndex Index position in line of virtual table.
         * @param {int} cellIndex Index position in column of virtual table.
         * @param {object} baseRow Row affected by this position.
         * @param {object} baseCell Cell affected by this position.
         * @param {bool} isSpan Inform if it is an span cell/row.
         */
        function setVirtualTablePosition(rowIndex, cellIndex, baseRow, baseCell, isRowSpan, isColSpan, isVirtualCell) {
            const objPosition = {
                'baseRow'  : baseRow,
                'baseCell' : baseCell,
                'isRowSpan': isRowSpan,
                'isColSpan': isColSpan,
                'isVirtual': isVirtualCell,
            };
            if (!_virtualTable[rowIndex]) {
                _virtualTable[rowIndex] = [];
            }
            _virtualTable[rowIndex][cellIndex] = objPosition;
        }

        /**
         * Create action cell object.
         *
         * @param {object} virtualTableCellObj Object of specific position on virtual table.
         * @param {enum} resultAction Action to be applied in that item.
         */
        function getActionCell(virtualTableCellObj, resultAction, virtualRowPosition, virtualColPosition) {
            return {
                'baseCell'    : virtualTableCellObj.baseCell,
                'action'      : resultAction,
                'virtualTable': {
                    'rowIndex' : virtualRowPosition,
                    'cellIndex': virtualColPosition,
                },
            };
        }

        /**
         * Recover free index of row to append Cell.
         *
         * @param {Array} _table _virtualTable / _matrixTable.
         * @param {int} rowIndex Index of row to find free space.
         * @param {int} cellIndex Index of cell to find free space in table.
         */
        function recoverCellIndex(_table, rowIndex, cellIndex) {
            if (!_table[rowIndex]) {
                return cellIndex;
            }
            if (!_table[rowIndex][cellIndex]) {
                return cellIndex;
            }

            let newCellIndex = cellIndex;
            while (_table[rowIndex][newCellIndex]) {
                newCellIndex++;
                if (!_table[rowIndex][newCellIndex]) {
                    return newCellIndex;
                }
            }
        }

        /**
         * Recover info about row and cell and add information to virtual table.
         *
         * @param {object} row Row to recover information.
         * @param {object} cell Cell to recover information.
         */
        function addCellInfoToVirtual(row, cell) {
            const cellIndex = recoverCellIndex(_virtualTable, row.rowIndex, cell.cellIndex);
            const cellHasColspan = (cell.colSpan > 1);
            const cellHasRowspan = (cell.rowSpan > 1);
            const isThisSelectedCell = (row.rowIndex === _startPoint.rowPos && cell.cellIndex === _startPoint.colPos);
            setVirtualTablePosition(row.rowIndex, cellIndex, row, cell, cellHasRowspan, cellHasColspan, false);

            // Add span rows to virtual Table.
            const rowspanNumber = cell.attributes.rowSpan ? parseInt(cell.attributes.rowSpan.value, 10) : 0;
            if (rowspanNumber > 1) {
                for (let rp = 1; rp < rowspanNumber; rp++) {
                    const rowspanIndex = row.rowIndex + rp;
                    adjustStartPoint(rowspanIndex, cellIndex, cell, isThisSelectedCell);
                    setVirtualTablePosition(rowspanIndex, cellIndex, row, cell, true, cellHasColspan, true);
                }
            }

            // Add span cols to virtual table.
            const colspanNumber = cell.attributes.colSpan ? parseInt(cell.attributes.colSpan.value, 10) : 0;
            if (colspanNumber > 1) {
                for (let cp = 1; cp < colspanNumber; cp++) {
                    const cellspanIndex = recoverCellIndex(_virtualTable, row.rowIndex, (cellIndex + cp));
                    adjustStartPoint(row.rowIndex, cellspanIndex, cell, isThisSelectedCell);
                    setVirtualTablePosition(row.rowIndex, cellspanIndex, row, cell, cellHasRowspan, true, true);
                }
            }
        }

        /**
         * Process validation and adjust of start point if needed
         *
         * @param {int} rowIndex
         * @param {int} cellIndex
         * @param {object} cell
         * @param {bool} isSelectedCell
         */
        function adjustStartPoint(rowIndex, cellIndex, cell, isSelectedCell) {
            if (rowIndex === _startPoint.rowPos && _startPoint.colPos >= cell.cellIndex && cell.cellIndex <= cellIndex && !isSelectedCell) {
                _startPoint.colPos++;
            }
        }

        /**
         * Create virtual table of cells with all cells, including span cells.
         */
        function createVirtualTable() {
            const rows = domTable.rows;
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const cells = rows[rowIndex].cells;
                for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    addCellInfoToVirtual(rows[rowIndex], cells[cellIndex]);
                }
            }
        }

        /**
         * Get action to be applied on the cell.
         *
         * @param {object} cell virtual table cell to apply action
         */
        function getDeleteResultActionToCell(cell) {
            switch (where) {
                case TableResultAction.where.Column:
                    if (cell.isColSpan) {
                        return TableResultAction.resultAction.SubtractSpanCount;
                    }
                    break;
                case TableResultAction.where.Row:
                    if (!cell.isVirtual && cell.isRowSpan) {
                        return TableResultAction.resultAction.AddCell;
                    } else if (cell.isRowSpan) {
                        return TableResultAction.resultAction.SubtractSpanCount;
                    }
                    break;
            }
            return TableResultAction.resultAction.RemoveCell;
        }

        /**
         * Get action to be applied on the cell.
         *
         * @param {object} cell virtual table cell to apply action
         */
        function getAddResultActionToCell(cell) {
            switch (where) {
                case TableResultAction.where.Column:
                    if (cell.isColSpan) {
                        return TableResultAction.resultAction.SumSpanCount;
                    } else if (cell.isRowSpan && cell.isVirtual) {
                        return TableResultAction.resultAction.Ignore;
                    }
                    break;
                case TableResultAction.where.Row:
                    if (cell.isRowSpan) {
                        return TableResultAction.resultAction.SumSpanCount;
                    } else if (cell.isColSpan && cell.isVirtual) {
                        return TableResultAction.resultAction.Ignore;
                    }
                    break;
            }
            return TableResultAction.resultAction.AddCell;
        }

        /**
         * Create matrix table of cells with all cells, including span cells.
         */
        function createMatrixTable() {
            const rows = domTable.rows;
            for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                const cells = rows[rowIndex].cells;
                for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    addCellInfoToMatrix(rows[rowIndex], cells[cellIndex]);
                }
            }
        }

        /**
         * Define matrix table position info object.
         *
         * @param {int} rowIndex Index position in line of matrix table.
         * @param {int} cellIndex Index position in column of matrix table.
         * @param {object} baseRow Row affected by this position.
         * @param {object} baseCell Cell affected by this position.
         * @param {bool} isRowSpan Inform if it is an span row.
         * @param {bool} isColSpan Inform if it is an span cell.
         * @param {bool} isVirtualCell Inform if it is an virtual cell.
         */
        function setMatrixTable(rowIndex, cellIndex, baseRow, baseCell, isRowSpan, isColSpan, isVirtualCell) {
            const objPosition = {
                'baseRow'  : baseRow,
                'baseCell' : baseCell,
                'isRowSpan': isRowSpan,
                'isColSpan': isColSpan,
                'isVirtual': isVirtualCell,
            };
            if (!_matrixTable[rowIndex]) {
                _matrixTable[rowIndex] = [];
            }

            _matrixTable[rowIndex][cellIndex] = objPosition;
        }

        /**
         * Recover info about row and cell and add information to matrix table.
         *
         * @param {object} row Row to recover information.
         * @param {object} cell Cell to recover information.
         */
        function addCellInfoToMatrix(row, cell) {
            const rowIndex = row.rowIndex;
            const cellIndex = recoverCellIndex(_matrixTable, row.rowIndex, cell.cellIndex);
            const cellHasRowspan = (cell.rowSpan > 1);
            const cellHasColspan = (cell.colSpan > 1);
            setMatrixTable(rowIndex, cellIndex, row, cell, cellHasRowspan, cellHasColspan, false);

            const rowspanNumber = cell.rowSpan;
            const colspanNumber = cell.colSpan;

            if (cellHasColspan) {
                for (let colCount = 1; colCount < colspanNumber; colCount++) {
                    setMatrixTable(rowIndex, cellIndex + colCount, row, cell, cellHasRowspan, cellHasColspan, true);
                }
            }

            if (cellHasRowspan) {
                for (let rowCount = 1; rowCount < rowspanNumber; rowCount++) {
                    setMatrixTable(rowIndex + rowCount, cellIndex, row, cell, cellHasRowspan, cellHasColspan, true);
                    if (cellHasColspan) {
                        for (let colCount = 1; colCount < colspanNumber; colCount++) {
                            setMatrixTable(rowIndex + rowCount, cellIndex + colCount, row, cell, cellHasRowspan, cellHasColspan, true);
                        }
                    }
                }
            }

        }

        function init() {
            setStartPoint();
            createVirtualTable();
            createMatrixTable();
        }

        /// ///////////////////////////////////////////
        // Public functions
        /// ///////////////////////////////////////////

        /**
         * Recover array os what to do in table.
         */
        this.getActionList = function () {
            const fixedRow = (where === TableResultAction.where.Row) ? _startPoint.rowPos : -1;
            const fixedCol = (where === TableResultAction.where.Column) ? _startPoint.colPos : -1;

            let actualPosition = 0;
            let canContinue = true;
            while (canContinue) {
                const rowPosition = (fixedRow >= 0) ? fixedRow : actualPosition;
                const colPosition = (fixedCol >= 0) ? fixedCol : actualPosition;
                const row = _virtualTable[rowPosition];
                if (!row) {
                    canContinue = false;
                    return _actionCellList;
                }
                const cell = row[colPosition];
                if (!cell) {
                    canContinue = false;
                    return _actionCellList;
                }

                // Define action to be applied in this cell
                let resultAction = TableResultAction.resultAction.Ignore;
                switch (action) {
                    case TableResultAction.requestAction.Add:
                        resultAction = getAddResultActionToCell(cell);
                        break;
                    case TableResultAction.requestAction.Delete:
                        resultAction = getDeleteResultActionToCell(cell);
                        break;
                }
                _actionCellList.push(getActionCell(cell, resultAction, rowPosition, colPosition));
                actualPosition++;
            }

            return _actionCellList;
        };

        /**
         * Return _virtualTable
         */
        this.getVirtualTable = function () {
            return _virtualTable;
        };

        /**
         * Return _matrixTable
         */
        this.getMatrixTable = function () {
            return _matrixTable;
        };

        /**
         * Return Column count
         */
        this.getColCount = function () {
            let columnCount = 0;
            for (let i = 0; i < _matrixTable.length; i++) {
                let row = _matrixTable[i];
                if (columnCount <= row.length) columnCount = row.length;
            }
            return columnCount;
        };


        init();
    };
    /**
     *
     * Where action occours enum.
     */
    TableResultAction.where = {'Row': 0, 'Column': 1};
    /**
     *
     * Requested action to apply enum.
     */
    TableResultAction.requestAction = {'Add': 0, 'Delete': 1};
    /**
     *
     * Result action to be executed enum.
     */
    TableResultAction.resultAction = {
        'Ignore'           : 0,
        'SubtractSpanCount': 1,
        'RemoveCell'       : 2,
        'AddCell'          : 3,
        'SumSpanCount'     : 4
    };


    // Extends summernote
    $.extend(true, $.summernote.options, {
        jTable: {
            mergeMode: 'drag',  // drag || dialog
        },
    });
    $.extend(true, $.summernote.lang, {
        'en-US': {
            jTable: {
                borderColor    : 'border color',
                merge          : {
                    merge  : 'cell merge',
                    colspan: 'colspan',
                    rowspan: 'rowspan',
                    split  : 'cell split',
                },
                align          : {
                    top     : 'top',
                    middle  : 'middle',
                    bottom  : 'bottom',
                    baseline: 'baseline',
                },
                info           : {
                    info  : 'table info',
                    margin: 'margin'
                },
                apply          : 'apply',
                addDeleteRowCOl: 'Row/Col(Add/Del)',
                areaReset      : 'area Reset',
                message        : '<b>Available after unmerge<br/>current or surrounding cells</br>',
            }
        },
        'ko-KR': {
            jTable: {
                borderColor    : '선색',
                merge          : {
                    merge  : '셀 합치기',
                    colspan: '가로',
                    rowspan: '세로',
                    split  : '셀 나누기',
                },
                align          : {
                    top     : '위쪽 정렬',
                    middle  : '가운데 정렬',
                    bottom  : '아래쪽 정렬',
                    baseline: '기본 정렬',
                },
                info           : {
                    info  : '테이블 정보',
                    margin: '여백'
                },
                apply          : '적용',
                addDeleteRowCOl: '행/열(추가/삭제)',
                areaReset      : '넓이/높이 초기화',
                message        : '<b>현재 또는 주위 셀<br/>병합 해제 후 사용 가능</b>',
            }
        },
    });
    $.extend(true, $.summernote, {
        plugins: {
            jTable: JTablePlugin,
        },
    });
}));
