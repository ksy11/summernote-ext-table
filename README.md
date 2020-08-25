# summernote-ext-table v0.1
A plugin for the [Summernote](https://github.com/summernote/summernote/) WYSIWYG editor.

### Installation

#### 1. Include CSS/JS
```html
<!-- style -->
<link href="../script/summernote/plugin/table/summernote-ext-table.css" rel="stylesheet" type="text/css">
<!-- javascript -->
<script src="../script/summernote/plugin/table/summernote-ext-table.js"></script>
```

#### 2. Summernote option
```
Summernote Toolbar. ('table' => 'jTable')
['insert', ['hr', 'jTable', 'link', 'picture']],
```
```
Summernote popover-table.
table: [
    ['merge', ['jMerge']],
    ['style', ['jBackcolor', 'jBorderColor', 'jAlign', 'jAddDeleteRowCol']],
    ['info', ['jTableInfo']],
    ['delete', ['jWidthHeightReset', 'deleteTable']],
]
```
#### 3. Summernote init
```javascript
        $(document).ready(function () {
            $('#summernote').summernote({
                lang   : "ko-KR",
                height : 300,
                toolbar: [
                    ['style', ['style']],
                    ['font', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript', 'clear']],
                    ['fontname', ['fontname', 'fontsize', 'color']],
                    ['para', ['ul', 'ol', 'paragraph', 'height']],
                    ['insert', ['hr', 'jTable', 'link', 'picture']],
                    ['misc', ['undo', 'redo', 'fullscreen']],
                ],
                popover: {
                    table: [
                        ['merge', ['jMerge']],
                        ['style', ['jBackcolor', 'jBorderColor', 'jAlign', 'jAddDeleteRowCol']],
                        ['info', ['jTableInfo']],
                        ['delete', ['jWidthHeightReset', 'deleteTable']],
                    ]
                },
                jTable : {
                    /**
                     * drag || dialog
                     */
                    mergeMode: 'drag'
                }
            });
        });
```


I'm check only v0.8.16-lite version.

This project is discard after push. ^^.....Bye. Good Luck.

