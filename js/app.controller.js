import { utilService } from './services/util.service.js'
import { locService } from './services/loc.service.js'
import { mapService } from './services/map.service.js'

window.onload = onInit

var gUserPos

// To make things easier in this project structure 
// functions that are called from DOM are defined on a global app object
window.app = {
    onRemoveLoc,
    onUpdateLoc,
    onSelectLoc,
    onPanToUserPos,
    onSearchAddress,
    onCopyLoc,
    onShareLoc,
    onSetSortBy,
    onSetFilterBy,
    onModalSubmit,
    showModal
}

function onInit() {
    loadAndRenderLocs()

    mapService.initMap()
        .then(() => {
            // onPanToTokyo()
            mapService.addClickListener(onAddLoc)
        })
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot init map')
        })
}

function renderLocs(locs) {
    const selectedLocId = getLocIdFromQueryParams()

    var strHTML = locs.map(loc => {
        const className = (loc.id === selectedLocId) ? 'active' : ''
        let distance = gUserPos ? utilService.getDistance({ lat: loc.geo.lat, lng: loc.geo.lng }, gUserPos, 'K') : ''
        return `
        <li class="loc ${className}" data-id="${loc.id}">
            <h4>  
                <span>${loc.name}</span>
                <span title="${loc.rate} stars">${'★'.repeat(loc.rate)}</span>
            </h4>
            <p class="distance">Distance from you: ${distance}</p>
            <p class="muted">
                Created: ${utilService.elapsedTime(loc.createdAt)}
                ${(loc.createdAt !== loc.updatedAt) ?
                ` | Updated: ${utilService.elapsedTime(loc.updatedAt)}`
                : ''}
            </p>
            <div class="loc-btns">     
               <button title="Delete" onclick="app.onRemoveLoc('${loc.id}')">🗑️</button>
               <button title="Edit" onclick="app.onUpdateLoc('${loc.id}')">✏️</button>
               <button title="Select" onclick="app.onSelectLoc('${loc.id}')">🗺️</button>
            </div>     
        </li>`}).join('')

    const elLocList = document.querySelector('.loc-list')
    elLocList.innerHTML = strHTML || 'No locs to show'

    renderLocStats()

    if (selectedLocId) {
        const selectedLoc = locs.find(loc => loc.id === selectedLocId)
        displayLoc(selectedLoc)
    }
    document.querySelector('.debug').innerText = JSON.stringify(locs, null, 2)
}

function onRemoveLoc(locId) {
    if (!confirm('Are you sure you want to delete this location?')) return
    locService.remove(locId)
        .then(() => {
            flashMsg('Location removed')
            unDisplayLoc()
            loadAndRenderLocs()
        })
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot remove location')
        })
}

function onSearchAddress(ev) {
    ev.preventDefault()
    const el = document.querySelector('[name=address]')
    mapService.lookupAddressGeo(el.value)
        .then(geo => {
            mapService.panTo(geo)
        })
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot lookup address')
        })
}

var gKeepResolve

function onAddLoc(geo) {

    var prm = showModal()
    prm.then(loc => locService.save({ name: loc.name, rate: loc.rate, geo }))
        .then((savedLoc) => {
            flashMsg(`Added Location (id: ${savedLoc.id})`);
            utilService.updateQueryParams({ locId: savedLoc.id });
            loadAndRenderLocs();
        })
        .then()
        .catch(err => {
            console.error('OOPs:', err);
            flashMsg('Cannot add location');
        });

            if (!locName) return;

function showModal() {
    document.getElementById('locModal').style.display = 'block'
    return new Promise(resolve => {
        gKeepResolve = resolve
    })
}


function onModalSubmit(decision) {
    const locName = document.getElementById('locName').value;
    const rate = +document.getElementById('rate').value;


    const modal = document.getElementById('locModal');
    modal.style.display = 'none';


    if (!locName) return;

    // const loc = {
    //     name: locName,
    //     rate: rate,
    //     geo: geo
    // };


    gKeepResolve({
        name: locName,
        rate: rate,
    })
    // locService.save(loc)
    //     .then((savedLoc) => {
    //         flashMsg(`Added Location (id: ${savedLoc.id})`);
    //         utilService.updateQueryParams({ locId: savedLoc.id });
    //         loadAndRenderLocs();
    //     })
    //     .then()
    //     .catch(err => {
    //         console.error('OOPs:', err);
    //         flashMsg('Cannot add location');
    //     });
}

function showModal() {
    const modal = document.querySelector("#locModal");
    if (!modal) {
        console.error('Modal not found');
        return Promise.reject('Modal not found');
    }

    modal.style.display = "block";

    const nameInput = document.getElementById('locName');
    const rateInput = document.getElementById('rate');

    return new Promise((resolve, reject) => {
        const onSubmit = () => {
            const name = nameInput.value;
            const rate = +rateInput.value;

            if (!name) {
                reject("Name cannot be empty");
            } else {
                modal.style.display = "none";
                resolve({ name, rate });
            }
        };

        const onCancel = () => {
            modal.style.display = "none";
            reject("User canceled");
        };

        // Add event listeners only if the elements are found
        const submitButton = modal.querySelector('button[type="submit"]');
        const cancelButton = modal.querySelector('button[type="cancel"]');
        
        if (submitButton && cancelButton) {
            submitButton.addEventListener('click', onSubmit);
            cancelButton.addEventListener('click', onCancel);
        } else {
            console.error('Submit or cancel button not found');
            reject('Submit or cancel button not found');
        }
    });
}

function onModalSubmit() {
    const nameInput = document.getElementById('locName');
    const rateInput = document.getElementById('rate');

    const name = nameInput.value;
    const rate = +rateInput.value;

    // Validate the inputs if needed
    if (!name) {
        alert('Name cannot be empty');
        return;
    }

    // Now you can use the 'name' and 'rate' variables to perform actions, e.g., save the location.
    // For simplicity, let's log them to the console in this example.
    console.log('Name:', name);
    console.log('Rate:', rate);

    // You can also resolve a promise with the gathered data if needed.
    // For example, you can modify the return statement like this:
    // resolve({ name, rate });
}


function loadAndRenderLocs() {
    locService.query()
        .then(renderLocs)
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot load locations')
        })
}

function onPanToUserPos() {
    mapService.getUserPosition()
        .then(latLng => {
            mapService.panTo({ ...latLng, zoom: 15 })
            unDisplayLoc()
            gUserPos = latLng
            loadAndRenderLocs()
            flashMsg(`You are at Latitude: ${latLng.lat} Longitude: ${latLng.lng}`)
        })
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot get your position')
        })
}

function onUpdateLoc(locId) {
    locService.getById(locId)
        .then(loc => {
            const rate = prompt('New rate?', loc.rate)
            if (rate !== loc.rate) {
                loc.rate = rate
                locService.save(loc)
                    .then(savedLoc => {
                        flashMsg(`Rate was set to: ${savedLoc.rate}`)
                        loadAndRenderLocs()
                    })
                    .catch(err => {
                        console.error('OOPs:', err)
                        flashMsg('Cannot update location')
                    })

            }
        })
}

function onSelectLoc(locId) {
    return locService.getById(locId)
        .then(displayLoc)
        .catch(err => {
            console.error('OOPs:', err)
            flashMsg('Cannot display this location')
        })
}

function displayLoc(loc) {
    document.querySelector('.loc.active')?.classList?.remove('active')
    document.querySelector(`.loc[data-id="${loc.id}"]`).classList.add('active')

    mapService.panTo(loc.geo)
    mapService.setMarker(loc)

    const el = document.querySelector('.selected-loc')
    el.querySelector('.loc-name').innerText = loc.name
    el.querySelector('.loc-address').innerText = loc.geo.address
    el.querySelector('.loc-rate').innerHTML = '★'.repeat(loc.rate)
    el.querySelector('[name=loc-copier]').value = window.location
    el.classList.add('show')

    utilService.updateQueryParams({ locId: loc.id })
}

function unDisplayLoc() {
    utilService.updateQueryParams({ locId: '' })
    document.querySelector('.selected-loc').classList.remove('show')
    mapService.setMarker(null)
}

function onCopyLoc() {
    const elCopy = document.querySelector('[name=loc-copier]')
    elCopy.select()
    elCopy.setSelectionRange(0, 99999) // For mobile devices
    navigator.clipboard.writeText(elCopy.value)
    flashMsg('Link copied, ready to paste')
}

function onShareLoc() {
    const url = document.querySelector('[name=loc-copier]').value

    // title and text not respected by any app (e.g. whatsapp)
    const data = {
        title: 'Cool location',
        text: 'Check out this location',
        url
    }
    navigator.share(data)
}

function flashMsg(msg) {
    const el = document.querySelector('.user-msg')
    el.innerText = msg
    el.classList.add('open')
    setTimeout(() => {
        el.classList.remove('open')
    }, 3000)
}

function getLocIdFromQueryParams() {
    const queryParams = new URLSearchParams(window.location.search)
    const locId = queryParams.get('locId')
    return locId
}

function onSetSortBy() {
    const prop = document.querySelector('.sort-by').value;
    const isDesc = document.querySelector('.sort-desc').checked;

    if (!prop) return;

    const sortBy = {};

    if (prop === 'createdAt') {
        sortBy[prop] = (isDesc) ? -1 : 1;
    } else {
        sortBy[prop] = (isDesc) ? -1 : 1;
    }

    locService.setSortBy(sortBy);
    loadAndRenderLocs();
}




function onSetFilterBy({ txt, minRate }) {
    const filterBy = locService.setFilterBy({ txt, minRate: +minRate })
    utilService.updateQueryParams(filterBy)
    loadAndRenderLocs()
}

function renderLocStats() {
    locService.getLocCountByRateMap().then(stats => {
        handleStats(stats, 'loc-stats-rate')
    })
    locService.getLocCountByLastUpdateMap().then(stats => {
        handleStats(stats, 'loc-stats-last-update')
    })
}

function handleStats(stats, selector) {
    // stats = { low: 37, medium: 11, high: 100, total: 148 }
    // stats = { low: 5, medium: 5, high: 5, baba: 55, mama: 30, total: 100 }
    const labels = cleanStats(stats)
    const colors = utilService.getColors()

    var sumPercent = 0
    var colorsStr = `${colors[0]} ${0}%, `
    labels.forEach((label, idx) => {
        if (idx === labels.length - 1) return
        const count = stats[label]
        const percent = Math.round((count / stats.total) * 100, 2)
        sumPercent += percent
        colorsStr += `${colors[idx]} ${sumPercent}%, `
        if (idx < labels.length - 1) {
            colorsStr += `${colors[idx + 1]} ${sumPercent}%, `
        }
    })

    colorsStr += `${colors[labels.length - 1]} ${100}%`
    // Example:
    // colorsStr = `purple 0%, purple 33%, blue 33%, blue 67%, red 67%, red 100%`

    const elPie = document.querySelector(`.${selector} .pie`)
    const style = `background-image: conic-gradient(${colorsStr})`
    elPie.style = style

    const ledendHTML = labels.map((label, idx) => {
        return `
                <li>
                    <span class="pie-label" style="background-color:${colors[idx]}"></span>
                    ${label} (${stats[label]})
                </li>
            `
    }).join('')

    const elLegend = document.querySelector(`.${selector} .legend`)
    elLegend.innerHTML = ledendHTML
}

function cleanStats(stats) {
    const cleanedStats = Object.keys(stats).reduce((acc, label) => {
        if (label !== 'total' && stats[label]) {
            acc.push(label)
        }
        return acc
    }, [])
    return cleanedStats
}
