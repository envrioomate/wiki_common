const apiBaseUrl = "https://www.enviroommate.org/app-dev/api/sync"
const apiKey = "secret" //TODO replace with something from the wiki config 

// use on start page to display warnings
$(function() {
    var nodeGetWarnings = document.getElementById('node-get-warnings');
    if(!nodeGetWarnings) return;

    const warnUrl = apiBaseUrl + "/pagesWithWarnings/" + apiKey; 
    console.log("load all page warnings here");

    $.getJSON(warnUrl)
        .done(function (res) {
            var warnings = JSON.parse(res.warnings);
            $('#node-get-warnings a').each(function(idx, a) {
                var pageId = getUrlParam($(a).attr('href'), "dpl_id");
                console.log(pageId);
                console.log(warnings);
                var pageWarnings = warnings.filter(function (data) {
                    return data.pageId == pageId;
                });
                console.log(pageWarnings);
                if(pageWarnings && pageWarnings.length > 0) {

                    $(a).append("<span style=\"background-color: yellow;\">❕</span>")
                }
            });
        })
        .fail(function (err) { console.error(err) })

}());

// stolen from https://stackoverflow.com/a/15780907
function getUrlParam(url, name) {
    return (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1];
}

// get status of page
$(function() {    
    var nodeGetPageStatus = document.getElementById('node-get-page-status');
    if(!nodeGetPageStatus) return;

    const pageId = mw.config.values.wgArticleId;
    console.log("Page integration for pageId " + pageId + " loaded!");

    resyncPage(pageId, nodeGetPageStatus)
}());

function resyncPage(pageId, parentDiv) {

    parentDiv.innerHTML = '';

    var warningContainer = document.createElement("div");
    parentDiv.append(warningContainer);
    refreshWarnings(pageId, warningContainer)
}

function refreshWarnings(pageId, parentDiv) {
    const articleWarnUrl = apiBaseUrl + "/warnings/" + apiKey + "/" + pageId;
    $.getJSON( articleWarnUrl)
        .done(function(res) {

            if(res.lastSyncedRevId == mw.config.values.wgRevisionId ){
                $(parentDiv).append("<div class=\"synced-bubble\">App ist auf dem aktuellen Stand</div>")
            } else {
                makeRefreshButton(pageId, parentDiv);
            }

            const warnings = res.warnings.split('|');
            warnings.forEach(function(element) {
                console.log(element); 
                parentDiv.append(toWarningBubble(element));
            });

            
        })
        .fail(function(err) {
            this.innerHTML = "Ein Fehler ist aufgetreten: " + err.message;
            makeRefreshButton(pageId, parentDiv);
            console.log(err)
        });
}

function makeRefreshButton(pageId, parentDiv) {
    var refreshButton = document.createElement("button");
    refreshButton.setAttribute('class', 'btn');
    refreshButton.innerHTML = "<strong>Wiki Artikel zur App übertragen</strong"
    refreshButton.onclick = function(e) {
        this.disabled = true;
        this.innerHTML = "Warte auf Server..."
        const articlePushUrl = apiBaseUrl + "/" + apiKey + "/" + pageId;
        $.post(articlePushUrl)
        .done(function(res) {
            setTimeout(function() {
                resyncPage(pageId, parentDiv)
             }, 250);
        })
        .fail(function(err) {
            this.innerHTML = "Ein Fehler ist aufgetreten: " + err.message 
            console.log(err)
        });
    };
    parentDiv.append(refreshButton);
} 

function toWarningBubble(warning) {
    switch(warning) {
        case "NoTopic":
        return warningBubbleTemplate("Keine Themenwoche gefunden!");
        case "NoChallenges":
        return warningBubbleTemplate("Keine Herausforderungen gefunden!");
        case "NoSpareChallenges":
        return warningBubbleTemplate("Keine Ersatzherausforderungen gefunden!");
        case "NotEnoughDefaultChallenges":
        return warningBubbleTemplate("Weniger als 4 normale Herausforderungen gefunden!");
        case "TooManyDefaultChallenges":
        return warningBubbleTemplate("Mehr als 4 normale Herausforderungen gefunden!");
        case "EmptyText":
        return warningBubbleTemplate("Keine Wochenbeschreibung gefunden!");
        case "NoHeaderImage":
        return warningBubbleTemplate("Keine Bild gefunden!");
        case "TemplateParsingError":
        return warningBubbleTemplate("Seite kann nicht parsiert werden!");
    }
}

function warningBubbleTemplate(text) {
    var bubble = document.createElement("div");
    bubble.setAttribute("class", "warning-bubble");
    bubble.innerHTML = text;
    return bubble;
}