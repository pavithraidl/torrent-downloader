let HTMLParser = require('node-html-parser');
const axios = require('axios');
const fileManager = require('./core_lib/files');
const projectRootPath = fileManager.projectRootPath();
const dbFilePath = `${projectRootPath}db/index.json`;
const spawn = require('cross-spawn');
let allPages = 207;

console.log('starting torrent download...');
startDownload();

async function startDownload () {
    await downloadTorrent();

    for (let i = 2; i < allPages; i++) {
        await axios.get(`https://yts.mx/browse-movies/0/all/all/6/rating/2015-2021/en?page=${i}`).then(async (response) => {
            const html = HTMLParser.parse(response.data);
            let movies = html.querySelectorAll(".browse-movie-link");
            if (movies && movies.length > 0) {
                console.log(`Found ${movies.length} movies!`);
                let counter = 1;
                for (const movie of movies) {
                    console.log(`Running ${counter++}/${movies.length}`);
                    if (movie.attributes && movie.attributes.href) {
                        axios.get(movie.attributes.href).then((pageResponse) => {
                            const singlePageHtml = HTMLParser.parse(pageResponse.data);
                            let torrentFileLinks = singlePageHtml.querySelectorAll('#movie-info p.hidden-xs.hidden-sm a');
                            if (torrentFileLinks && torrentFileLinks.length > 0) {
                                for (const toDownloadTorrentFileNode of torrentFileLinks) {
                                    if (toDownloadTorrentFileNode.text.substr(0, 4) === '1080') {
                                        const toDownloadTorrentFileLink = toDownloadTorrentFileNode && toDownloadTorrentFileNode.attributes && toDownloadTorrentFileNode.attributes.href ? toDownloadTorrentFileNode.attributes.href : null;
                                        let db = fileManager.readFile(dbFilePath);
                                        if (db !== null && db !== false && toDownloadTorrentFileLink) {
                                            db = JSON.parse(db);
                                            db.push({
                                                link: toDownloadTorrentFileLink,
                                                status: 1, // 1 = ready to download, 2 - downloading, 3 - downloaded.
                                            });
                                            fileManager.writeFile(dbFilePath, JSON.stringify(db));
                                            console.log('URL has added to the DB!\n');
                                        }
                                    }
                                }
                            }
                        });
                    }
                    await sleep(5000);
                }
            }
            console.log('\n\nDownload complete!');
            console.log('starting torrent download...');
            await downloadTorrent();
        });
    }
}

/**
 * Download torrent using the torrent link
 */
async function downloadTorrent () {
    let db = fileManager.readFile(dbFilePath);
    if (db !== null && db !== false) {
        const torrentLinks = JSON.parse(db);
        let counter = 0;
        if (torrentLinks && torrentLinks.length > 0) {
            for (const torrentLink of torrentLinks) {
                if (torrentLink.status !== 1) {
                    continue;
                }
                torrentLinks[counter++].status = 2;
                fileManager.writeFile(dbFilePath, JSON.stringify(torrentLinks));
                await spawn.sync('webtorrent', ['download', torrentLink.link], {stdio: 'inherit'});
                torrentLinks[counter++].status = 3;
                fileManager.writeFile(dbFilePath, JSON.stringify(torrentLinks));
            }
        }
    }
    return true;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
