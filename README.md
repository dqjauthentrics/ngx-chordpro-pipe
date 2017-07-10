# ngx-chordpro-pipe
An Angular 4+ pipe to translate ChordPro text into HTML output.  Translates chords and 
directives, applying classes to trigger styles.  Includes support for transposing based
on changing the parameter for the number of half steps up (positive), or down (negative) from
the current key.

This code leveraged some work from Jonathan Perkin's 
<a href="https://github.com/jperkin/chordpro.js">chordpro.js</a> library.
## Usage
### Template
```
<div>    
    <input type="number" min="-11" max="+11" [(ngModel)]="nHalfSteps"/>
</div>
<div class="song" [innerHTML]="songText|chordpro:nHalfSteps"></div>
```

### Module
``
import {ChordproPipe} from 'path-to-pipes/chordpro.pipe';
``
### Component
```
@Component({
    templateUrl: './my.component.html',
    styleUrls: ['./chord-pro.scss'],
    encapsulation: ViewEncapsulation.None // important!
})
class MyComponent {
    ...
    public song '{title: Twinkle, Twinkle}\n' +
                '[C]Twinkle [C/E]twinkle [F]little [C]star\n' +
                '[F]How I [C]wonder [G]what you [C]are\n' +
                '{any-directive} \n' +
                'more stuff \n' +
                '{end-previous-directive}';
    public nHalfSteps = 0;
}
```

Note: I did not wrap this in a module because Angular package creation is a nightmare.
