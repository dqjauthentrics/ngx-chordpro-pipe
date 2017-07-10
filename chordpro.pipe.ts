/**
 * ChordProPipe
 *
 * A pipe for angular 2/4 that translate ChordPro-formatted text into an HTML representation, to be used in conjunction with a set of styles
 * for proper display.
 *
 * If you make improvements, please send them to me for incorporation.
 *
 * @author David Quinn-Jacobs (dqj@authentrics.com)
 * @licence Use this in any way you like, with no constraints.
 */
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'chordpro'})

export class ChordProPipe implements PipeTransform {
    private readonly MAX_HALF_STEPS = 11;

    private keys = [
        {name: 'Ab', value: 0},
        {name: 'A', value: 1},
        {name: 'A#', value: 2},
        {name: 'Bb', value: 2},
        {name: 'B', value: 3},
        {name: 'C', value: 4},
        {name: 'C#', value: 5},
        {name: 'Db', value: 5},
        {name: 'D', value: 6},
        {name: 'D#', value: 7},
        {name: 'Eb', value: 7},
        {name: 'E', value: 8},
        {name: 'F', value: 9},
        {name: 'F#', value: 10},
        {name: 'Gb', value: 10},
        {name: 'G', value: 11},
        {name: 'G#', value: 0}
    ];

    /**
     * @var inWord True if chord appears within a word.
     * @type {RegExp}
     */
    private inWord = /[a-z]$/;

    /**
     * @var chordRegex Expression used to determine if given line contains a chord.
     * @type {RegExp}
     */
    private chordRegex = /\[([^\]]*)\]/;

    /**
     * @var directiveRegex Expression used to determine if given line contains a directive (e.g., {title:My Title}, or {chorusbegin}.
     * @type {RegExp}
     */
    private directiveRegex = /\{([^\]]*)\}/;

    /**
     * @var commentRegex Expression used to determine if given line begins with a comment.
     * @type {RegExp}
     */
    private commentRegex = /^#/;

    /**
     * @var songLines An array of HTML output strings built by the parser.  This array is kept so that chord lines might be more easily transposed to new keys.
     * @type {Array}
     */
    private songLines = [];

    /**
     * @var chordRegex Expression used to determine if given line contains a chord.
     * @type {boolean}
     */
    private inDirective = false;

    /**
     * Pipe transformation for ChordPro-formatted song texts.
     * @param {string} song
     * @param {number} nHalfSteps
     * @returns {string}
     */
    transform(song: string, nHalfSteps: number): string {
        let transformed = song;
        try {
            if (song !== undefined && song) {
                this.songLines = [];
                this.parseToHTML(song, nHalfSteps);
                transformed = this.songLines.join(' ');
                return transformed;
            }
            else {
                return transformed;
            }
        }
        catch (exception) {
            console.warn('chordpro translation error', exception);
        }
    }

    chordRoot(chord) {
        let root = '';
        let ch2 = '';
        if (chord && chord.length > 0) {
            root = chord.substr(0, 1);
            if (chord.length > 1) {
                ch2 = chord.substr(1, 1);
                if (ch2 === 'b' || ch2 === '#') {
                    root += ch2;
                }
            }
        }
        return root;
    }

    restOfChord(chord) {
        let rest = '';
        let root = this.chordRoot(chord);
        if (chord.length > root.length) {
            rest = chord.substr(root.length);
        }
        return rest;
    }

    /**
     * Transpose the given chord the given (positive or negative) number of half steps.
     * @param {string} chordRoot
     * @param {number} nHalfSteps
     * @returns {string}
     */
    transposeChord(chordRoot, nHalfSteps) {
        let pos = -1;
        for (let i = 0; i < this.keys.length; i++) {
            if (this.keys[i].name === chordRoot) {
                pos = this.keys[i].value;
                break;
            }
        }
        if (pos >= 0) {
            pos += nHalfSteps;
            if (pos < 0) {
                pos += this.MAX_HALF_STEPS;
            }
            else if (pos > this.MAX_HALF_STEPS) {
                pos -= this.MAX_HALF_STEPS + 1;
            }
            for (let i = 0; i < this.keys.length; i++) {
                if (this.keys[i].value === pos) {
                    return this.keys[i].name;
                }
            }
        }
        return chordRoot;
    }

    /**
     * Append a lyric or chord line to the output lines list, with the given class.
     */
    private appendLine(line: string, className: string) {
        this.songLines.push('<div class="' + className + '">' + line + '</div>');
    };

    /**
     * Append a ChordPro directive to the song output lines.
     * @param {string} line
     */
    private appendDirective(line: string) {
        let mode = 'simple';
        let directive = '';
        let pos = line.indexOf(':');
        if (pos > 0) {
            directive = line.substr(1, pos - 1);
            line = line.trim().substr(pos + 1);
            line = line.substr(0, line.length - 1).trim();
        }
        else { // directive in {dir} form
            pos = line.indexOf('}');
            if (pos > 0) {
                line = '';
                directive = line.substr(0, -1).trim();
                mode = (this.inDirective ? 'endBlock' : 'startBlock');
                this.inDirective = !this.inDirective;
            }
        }
        switch (mode) {
            case 'simple':
                this.songLines.push('<div class="' + directive + '">' + line + '</div>');
                break;
            case 'startBlock':
                this.songLines.push('<div class="' + directive + '">');
                break;
            case 'endBlock':
                this.songLines.push('</div>');
                break;
        }
    }

    /**
     * Parse a string containing a ChordPro-formatted song, building an array of output HTML lines.
     *
     * @param {number} nHalfSteps
     * @param {string} song
     */
    private parseToHTML(song: string, nHalfSteps = 0) {
        let comp = this;
        if (!song) {
            return;
        }
        song.split('\n').forEach(function (line, linenum) {
            /* Comment, ignore */
            if (line.match(comp.commentRegex)) {
                return;
            }
            else if (line.match(comp.directiveRegex)) {
                comp.appendDirective(line);
            }
            else if (line.match(comp.chordRegex)) {
                let chords = '';
                let lyrics = '';
                let chordlen = 0;
                line.split(comp.chordRegex).forEach(function (word, pos) {
                    let dash = 0;
                    if ((pos % 2) === 0) { // lyrics
                        lyrics = lyrics + word;
                        if (word.match(comp.inWord)) {
                            dash = 1;
                        }
                        if (word && word.length < chordlen) {
                            chords = chords + ' ';
                            lyrics = (dash === 1) ? lyrics + '- ' : lyrics + '  ';
                            for (let i = chordlen - word.length - dash; i !== 0; i--) {
                                lyrics = lyrics + ' ';
                            }
                        }
                        else if (word && word.length === chordlen) {
                            chords = chords + ' ';
                            lyrics = (dash === 1) ? lyrics + '-' : lyrics + ' ';
                        }
                        else if (word && word.length > chordlen) {
                            for (let i = word.length - chordlen; i !== 0; i--) {
                                chords = chords + ' ';
                            }
                        }
                    }
                    else { // chords
                        let chord = word.replace(/[[]]/, '');
                        if (nHalfSteps !== 0) {
                            let chordRoot = comp.chordRoot(chord);
                            let newRoot = comp.transposeChord(chordRoot, nHalfSteps);
                            chord = newRoot + comp.restOfChord(chord);
                        }
                        chordlen = chord.length;
                        chords = chords + chord;
                    }
                }, this);
                comp.appendLine(chords, 'chords');
                comp.appendLine(lyrics, 'lyrics');
                return;
            }
            else {
                comp.appendLine(line, 'lyrics'); // assume plain lyrics line
            }
        }, this);
    }
}
