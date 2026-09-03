# assets/img

New photos and screenshots go here. Reference them from `content/content.js`:

```js
images: [{ src: "assets/img/your-file.jpg", alt: "What it shows", caption: "Optional." }]
```

Until a file exists its figure removes itself, so the entry still looks finished.

## Two ways a photo silently fails

Both of these look fine on a Mac and break on the live site, so they're worth
checking before you commit.

**The name lies about the format.** A photo off an iPhone is often HEIC inside
even when it's called `.png` or `.jpg`, and no browser except Safari will show
it. `file` tells you what it really is:

```sh
file your-file.jpg          # want: "JPEG image data"
sips -s format jpeg -Z 2000 in.png --out out.jpg
```

**The name is the wrong case.** macOS thinks `Photo.JPG` and `photo.jpg` are the
same file. GitHub Pages runs on Linux and doesn't. `src` has to match the
filename exactly.

`npm run build` catches both — it checks each `src` against the real directory
listing and prints anything that wouldn't resolve on the server.

## Where the older photos live

`assets/images/` holds the photos that were already in the repo. They're
referenced the same way; there's nothing special about them beyond the folder
name. `assets/media/` holds videos and their poster frames.
