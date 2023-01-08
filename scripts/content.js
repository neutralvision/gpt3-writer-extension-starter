const insert = (content) => {
    // Find calmly editor input section
    const elements = document.getElementsByClassName('droid');

    if (elements.length == 0){
        // ideally shouldnt happen
        return;
    }

    const element = elements[0]

    // grab first p tag so we can replace with injection
    const pToRemove = element.childNodes[0];
    pToRemove.remove();

    // split content by /n
    const splitContent = content.split('\n');

    // wrap in p tags

    splitContent.forEach((content) => {
        const p = document.createElement('p');

        if (content === '') {
            const br = document.createElement('br');
            p.appendChild(br);
        } else {
            p.textContent = content;
        }

        element.appendChild(p);
    })

    // insert into HTML one at a time

    // on success return true
    return true;
}

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
    if (request.message === 'inject') {
        const { content } = request;

        const result = insert(content);

        console.log(content);

        if (!result) {
            sendResponse({ status: "failed" })
        }
        sendResponse({ status: "success" });

    }
});