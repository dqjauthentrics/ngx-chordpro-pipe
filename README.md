# ngx-chordpro-pipe
Angular 4+ pipe to translate ChordPro text into HTML output.

## Usage
````
            <div>
                <input type="number" min="-11" max="+11" [(ngModel)]="nHalfSteps"/>
            </div>
            <div class="song" [innerHTML]="post.body|chordpro:nHalfSteps"></div>
````
