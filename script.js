// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', () => {
    (() => {

        // Enable Tooltips
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
            .forEach(tooltip => {
                new bootstrap.Tooltip(tooltip)
            })

        // Enable Popovers
        document.querySelectorAll('[data-bs-toggle="popover"]')
            .forEach(popover => {
                new bootstrap.Popover(popover)
            })

        // Enable Toasts
        document.querySelectorAll('.toast')
            .forEach(toastNode => {
                const toast = new bootstrap.Toast(toastNode, {
                    autohide: false
                })
                toast.show()
            })

        // Enable Timeago
        document.querySelectorAll('.timeago')
            .forEach(timeNode => {
                const time = new Date(timeNode.getAttribute('datetime'));
                timeNode.textContent = time.toLocaleString();
                timeNode.setAttribute('title', time.toLocaleString());
                timeNode.setAttribute('data-bs-toggle', 'tooltip');
                timeNode.setAttribute('data-bs-placement', 'top');
                timeNode.setAttribute('data-bs-title', time.toLocaleString());
                new bootstrap.Tooltip(timeNode);
                // Enable timeago functionality
                if (window.timeago && typeof window.timeago.render === 'function') {
                    timeago.render(timeNode, {
                        // locale: 'en',
                        autoUpdate: true,
                        updateInterval: 60000
                    });
                } else {
                    console.warn('timeago.js is not loaded.');
                }
            });

        // Enable Calendars
        document.querySelectorAll('.calendar')
            .forEach(calendarNode => {
                const calendar = new FullCalendar.Calendar(calendarNode, {
                    themeSystem: 'bootstrap5'
                });
                calendar.render();
            })

        // Enable Emphasized elements
        document.querySelectorAll('[data-bs-toggle="emphasize"]')
            .forEach(emphasizeNode => {
                emphasizeNode.addEventListener('click', () => {
                    const target = document.querySelector(emphasizeNode.getAttribute('data-bs-target'));
                    if (target) {
                        if (!target.classList.contains('emphasized')) {
                            target.classList.toggle('emphasized');
                            const overlay = document.createElement('div');
                            overlay.className = 'emphasized-overlay';
                            document.body.appendChild(overlay);
                            target.addEventListener('click', () => {
                                target.classList.remove('emphasized');
                                overlay.remove();
                            });
                        }
                    } else {
                        console.warn(`Target element ${emphasizeNode.getAttribute('data-bs-target')} not found.`);
                    }
                });
            });

        // Add an IDE Helpers
        function handleIndent(el, out = false) {
            const TAB = '\t';

            const value = el.value;
            const start = el.selectionStart;
            const end   = el.selectionEnd;

            // indices of the first/last char we’ll touch (full-line selection)
            const lineStart = value.lastIndexOf('\n', start - 1) + 1; // 0 if not found
            let   lineEnd   = value.indexOf('\n', end);
            if (lineEnd === -1) lineEnd = value.length;

            const selected   = value.slice(lineStart, lineEnd);
            const lines      = selected.split('\n');

            if (!out) {
                // INDENT
                const indented = lines.map(l => TAB + l).join('\n');
                el.value = value.slice(0, lineStart) + indented + value.slice(lineEnd);

                // caret/selection
                el.selectionStart = start + TAB.length;                 // first line moved by 1
                el.selectionEnd   = end   + TAB.length * lines.length;  // every line moved by 1
            } else {
                // UNINDENT
                let removedFromFirst = 0;
                let removedTotal     = 0;

                const unindented = lines.map((l, i) => {
                    if (l.startsWith(TAB)) {
                        if (i === 0 && start >= lineStart) removedFromFirst += TAB.length;
                        removedTotal += TAB.length;
                        return l.slice(TAB.length);
                    }
                    // allow unindenting 4 spaces too (if user pasted spaces)
                    if (l.startsWith('    ')) {
                        if (i === 0 && start >= lineStart) removedFromFirst += 4;
                        removedTotal += 4;
                        return l.slice(4);
                    }
                    return l;
                }).join('\n');

                el.value = value.slice(0, lineStart) + unindented + value.slice(lineEnd);
                el.selectionStart = Math.max(lineStart, start - removedFromFirst);
                el.selectionEnd   = Math.max(el.selectionStart, end - removedTotal);
            }
        }
        function parseHighlightAttr(attr) {
            if (!attr) return new Set();
            const out = new Set();
            attr.split(',').forEach(part => {
                part = part.trim();
                if (!part) return;
                const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
                if (m) {
                    let a = +m[1], b = +m[2];
                    if (a > b) [a, b] = [b, a];
                    for (let i = a; i <= b; i++) out.add(i);
                } else if (/^\d+$/.test(part)) {
                    out.add(+part);
                }
            });
            return out;
        }
        function buildLineNumbers(linesEl, count) {
            const frag = document.createDocumentFragment();
            for (let i = 1; i <= count; i++) {
                const div = document.createElement('div');
                div.textContent = i;
                div.dataset.line = i;
                frag.appendChild(div);
            }
            linesEl.innerHTML = '';
            linesEl.appendChild(frag);
        }
        function markStaticHighlights(linesEl, set) {
            linesEl.querySelectorAll('div').forEach(div => {
                const n = +div.dataset.line;
                div.classList.toggle('highlight', set.has(n));
            });
        }
        function markSelection(linesEl, textarea) {
            const v = textarea.value;
            const start = textarea.selectionStart;
            const end   = textarea.selectionEnd;

            const startLine = v.slice(0, start).split('\n').length;
            const endLine   = v.slice(0, end).split('\n').length;

            const isRange = start !== end;

            linesEl.querySelectorAll('div').forEach(div => {
                const n = +div.dataset.line;
                div.classList.toggle('selected', isRange && n >= startLine && n <= endLine);
                div.classList.toggle('active', !isRange && n === startLine);
            });
        }

        // Enable IDE
        document.querySelectorAll('.ide')
            .forEach(ideNode => {

                // Create lines container
                const ideLinesNode = document.createElement('div');
                ideLinesNode.classList.add('lines');
                ideNode.prepend(ideLinesNode);

                // Create & inject copy button
                const copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.className = 'copy btn btn-sm btn-outline-secondary';
                copyBtn.setAttribute('aria-label', 'Copy to clipboard');
                copyBtn.setAttribute('data-bs-toggle', 'tooltip');
                copyBtn.setAttribute('data-bs-title', 'Copy');
                copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
                ideNode.appendChild(copyBtn);

                // Enable tooltip for this button
                const copyTooltip = new bootstrap.Tooltip(copyBtn);

                // Click handler
                copyBtn.addEventListener('click', async () => {
                    const start = ideEditorNode.selectionStart;
                    const end   = ideEditorNode.selectionEnd;
                    const text  = start !== end
                        ? ideEditorNode.value.slice(start, end)
                        : ideEditorNode.value;

                    try {
                        await navigator.clipboard.writeText(text);

                        // Give quick feedback
                        copyTooltip.setContent({ '.tooltip-inner': 'Copied!' });
                        copyTooltip.show();
                        setTimeout(() => {
                            copyTooltip.hide();
                            copyTooltip.setContent({ '.tooltip-inner': 'Copy' });
                        }, 1200);
                    } catch (err) {
                        // Fallback for older browsers
                        const prevStart = ideEditorNode.selectionStart;
                        const prevEnd   = ideEditorNode.selectionEnd;

                        ideEditorNode.select();
                        document.execCommand('copy');

                        // Restore selection
                        ideEditorNode.setSelectionRange(prevStart, prevEnd);

                        copyTooltip.setContent({ '.tooltip-inner': 'Copied!' });
                        copyTooltip.show();
                        setTimeout(() => {
                            copyTooltip.hide();
                            copyTooltip.setContent({ '.tooltip-inner': 'Copy' });
                        }, 1200);
                    }
                });

                // Identify the textarea for the IDE
                const ideEditorNode = ideNode.querySelector('textarea');

                // keep numbers in sync
                const refresh = () => {
                    const lines = ideEditorNode.value.split('\n').length;
                    const highlightSet = parseHighlightAttr(ideNode.getAttribute('data-bs-highlight') || ideEditorNode.getAttribute('data-bs-highlight'));
                    buildLineNumbers(ideLinesNode, lines);
                    markStaticHighlights(ideLinesNode, highlightSet);
                    markSelection(ideLinesNode, ideEditorNode);
                };

                // initial build
                refresh();

                // input → rebuild numbers & highlights
                ideEditorNode.addEventListener('input', refresh);

                // selection changes
                ['keyup', 'mouseup', 'select', 'selectionchange', 'click', 'input'].forEach(evt =>
                    ideEditorNode.addEventListener(evt, () => markSelection(ideLinesNode, ideEditorNode))
                );
                ideEditorNode.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown') {
                        // Let the browser move the caret first, then mark
                        requestAnimationFrame(() => markSelection(ideLinesNode, ideEditorNode));
                    }
                });

                // focus/blur → update selected lines
                ideEditorNode.addEventListener('blur', () => {
                    ideLinesNode.querySelectorAll('div').forEach(div => {
                        div.classList.remove('selected', 'active');
                    });
                });

                // keep the numbers column scrolled with the editor
                ideEditorNode.addEventListener('scroll', () => {
                    ideLinesNode.scrollTop = ideEditorNode.scrollTop;
                });

                // Tab / Shift+Tab indent handler you already have
                ideEditorNode.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                    e.preventDefault();
                    handleIndent(e.target, e.shiftKey);
                    // after indenting, selection moved → update selected lines
                    markSelection(ideLinesNode, ideEditorNode);
                    }
                });

                // simple hover effect for the numbers column
                ideLinesNode.addEventListener('mouseover', e => {
                    if (e.target.matches('[data-line]')) {
                    e.target.classList.add('hover');
                    }
                });
                ideLinesNode.addEventListener('mouseout', e => {
                    if (e.target.matches('[data-line]')) {
                    e.target.classList.remove('hover');
                    }
                });
            })
    })()
});
