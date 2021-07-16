let HTMLParser = require('node-html-parser');
const axios = require('axios');
const fileManager = require('./core_lib/files');
const projectRootPath = fileManager.projectRootPath();
const dbFilePath = `${projectRootPath}db/index.json`;
const spawn = require('cross-spawn');
const db = require('./db/index');
let allPages = 207;


async function startDownload () {
    for (let i = 1; i < allPages; i++) {
        const url = i === 1 ? 'https://yts.mx/browse-movies/0/all/all/6/rating/2015-2021/en' : `https://yts.mx/browse-movies/0/all/all/6/rating/2015-2021/en?page=${i}`;
        await axios.get(url).then(async (response) => {
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
                                        if (toDownloadTorrentFileLink) {
                                            db.createRecord({
                                                link: toDownloadTorrentFileLink,
                                                status: 1, // 1 = ready to download, 2 - downloading, 3 - downloaded.
                                            });
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
            console.log('\n\nLink fetch complete!');
            console.log('starting torrent download...');
            await downloadTorrent();
        });
    }
}

/**
 * Download torrent using the torrent link
 */
async function downloadTorrent () {
    process.chdir('E:/plex-library/movies');
    const torrentLinks = db.getRecords();
    if (torrentLinks && torrentLinks.length > 0) {
        for (const torrentLink of torrentLinks) {
            if (torrentLink.status > 2) {
                continue;
            }
            db.updateRecord(torrentLink.id, 'status', 2);
            const childProcessData = await spawn.sync('webtorrent', ['download', torrentLink.link], {stdio: 'inherit', timeout: 3600000});
            db.updateRecord(torrentLink.id, 'status', childProcessData && childProcessData.status === 1 ? 3 : 4);
        }
    }
    return true;
}

/**
 * Sleep the function
 *
 * @param ms
 * @return {Promise<number>}
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
