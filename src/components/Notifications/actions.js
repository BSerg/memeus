export function add() {
    let text = `add ${Math.random()}`;

    return {type: 'NOTIFICATIONS_ADD', text};
}