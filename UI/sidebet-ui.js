import { tableSettings } from "../services/table-server";
import { submitSideBet, hitGame01, dealGame02 } from "../socket-client";
import { getMoneyText } from "./money-display";
import { getCardImageFilePath } from './card-ui';
import { modes } from "./table-ui";

const submitButton = $('#submit-sidebet')[0];
const streetsOnSideBet = new Map();
streetsOnSideBet.set('PreCards', 'Next Cards');
streetsOnSideBet.set('PreFlop', 'Flop');
streetsOnSideBet.set('Flop', 'Turn');
streetsOnSideBet.set('Turn', 'River');
const sidebetStreetDiv = $(".street")[0];
const sidebetGame01Chips = $(".bet-chips button");
const sideberGameSubmitBtn = $(".hitme")[0];
const streetLabel = $(".text-street")[0];
const sidebetPanel = $(".side-bet_div")[0];

const gameModes = Object.freeze({
    None: 0,
    Game01: 1,
    Game02: 2,
});

export class SidebetUI {
    constructor(mainUI) {
        this.mainUI = mainUI;
        this.sidebetStreet = undefined;
        this.freeBalance = 1000;
        this.originalSidebetOption = undefined;
        this.currentSidebetOption = undefined;
        this.centerButtonId = 'buttoncenter';
        this.gameBetBBRatio = 0;
        this.isGame01Visible = false;
        this.currentGameMode = gameModes.None;
        this.init();
    }

    init() {
        sidebetStreetDiv.addEventListener('click', () => {
            if (this.isGame01Visible) {
                this.toggleSidebetGame();
            }
            else {
                if (this.originalSidebetOption.street == this.currentSidebetOption.street) {
                    this.updateSideBetOptions(tableSettings.precardSidebetOptions.street, tableSettings.precardSidebetOptions.streetText, tableSettings.precardSidebetOptions.options);
                } 
                else {
                    this.updateSideBetOptions(this.originalSidebetOption.street, this.originalSidebetOption.streetText, this.originalSidebetOption.options);
                }
            }
        });

        submitButton.addEventListener('click', () => {
            let sidebets = [];
            const elements = $('.btun');
            for (const button of elements) {
                if (button.classList.contains('selected')) {
                    sidebets.push(button.id);
                }
            }
            submitSideBet(sidebets, this.sidebetStreet);
            this.initSideBetPanel();
        });

        for (const chip of sidebetGame01Chips) {
            chip.addEventListener('click', (e) => {
                const clickedButtonId = e.target.parentNode.id;
                const clickedButton = document.getElementById(clickedButtonId);
                const centerButton = document.getElementById(this.centerButtonId);
            
                this.gameBetBBRatio = clickedButton.querySelector('img').getAttribute('value');
                // Add class "tobottom" to the image of the clicked button
                clickedButton.querySelector('.tarimg').classList.add('totop');
            
                // Remove class "totop" from the image of the center button
                centerButton.querySelector('.tarimg').classList.remove('totop');
            
                // Store the HTML content of the center button
                const temp = centerButton.querySelector('img').outerHTML;
            
                // Swap the HTML content of centerButton with the clickedButton
                centerButton.querySelector('img').outerHTML = clickedButton.querySelector('img').outerHTML;
                clickedButton.querySelector('img').outerHTML = temp;
                
                centerButton.id = clickedButtonId;
                clickedButton.id = this.centerButtonId;

                // Set the new center button id for the next click
                this.centerButtonId = clickedButtonId;
            });
        }

        sideberGameSubmitBtn.addEventListener('click', () => {
            if (this.currentGameMode == gameModes.Game01) {
                hitGame01(this.gameBetBBRatio, this.showGame01Result);
            }
            else if (this.currentGameMode == gameModes.Game02) {
                dealGame02(this.gameBetBBRatio, this.showGame02Result);
            }
            sideberGameSubmitBtn.disabled = true;
            setTimeout(() => {
                sideberGameSubmitBtn.disabled = false;
            }, 4000);
        });
    }

    toggleSidebetGame() {
        if (this.currentGameMode == gameModes.Game01) {
            sideberGameSubmitBtn.innerText = 'DEAL ME';
            this.currentGameMode = gameModes.Game02;
            streetLabel.innerText = "New Deal";
            this.gameBetBBRatio = 4;
            $('.bigcoin1 img')[0].setAttribute('src', 'images/sidebet_chip_2bb.svg');
            $('.bigcoin2 img')[0].setAttribute('src', 'images/sidebet_chip_4bb.svg');
            $('.bigcoin3 img')[0].setAttribute('src', 'images/sidebet_chip_8bb.svg');
            $('.bigcoin1 img')[0].setAttribute('value', '2');
            $('.bigcoin2 img')[0].setAttribute('value', '4');
            $('.bigcoin3 img')[0].setAttribute('value', '8');
        }
        else {
            sideberGameSubmitBtn.innerText = 'HIT ME';
            this.currentGameMode = gameModes.Game01;
            streetLabel.innerText = "Hit The Dealer";
            this.gameBetBBRatio = 2;
            $('.bigcoin1 img')[0].setAttribute('src', 'images/sidebet_chip_1bb.svg');
            $('.bigcoin2 img')[0].setAttribute('src', 'images/sidebet_chip_2bb.svg');
            $('.bigcoin3 img')[0].setAttribute('src', 'images/sidebet_chip_4bb.svg');
            $('.bigcoin1 img')[0].setAttribute('value', '1');
            $('.bigcoin2 img')[0].setAttribute('value', '2');
            $('.bigcoin3 img')[0].setAttribute('value', '4');
        }
    }
    
    initSideBetPanel() {
        $('#submit-sidebet').find('#total-amount')[0].innerText = '0';
        $('#total-payout')[0].innerText = '0';

        const payoutBtns = $(".scroll_prents").find(".button_payout");
        for (const payoutbtn of payoutBtns) {
            payoutbtn.style.visibility = 'hidden';
        }

        const elements = $('.btun');
        for (const button of elements) {
            if (button.classList.contains('selected')) {
                button.classList.remove("selected");
            }
        }
    }

    setCurrentSidebetOptions(street, streetText, options) {
        this.originalSidebetOption = { street, streetText, options };
    }

    updateSideBetOptions(street, streetText, options) {
        this.sidebetStreet = street;
        $(".scroll_prents").find('.fund_prent').remove();
        $('#submit-sidebet').find('#total-amount')[0].innerText = '0';
        $('#total-payout')[0].innerText = '0';
        streetLabel.innerText = this.isGame01Visible ? "Hit the dealer" : streetsOnSideBet.get(streetText) || "Street";

        if (!street) return;

        this.currentSidebetOption = { street, streetText, options };
        let div = '';
        for (const option of options) {
            div = div + `<div class="fund_prent mb-1 mt-1">
                            <div class="fund3 ">
                                <div class="top_prent">
                                    <div class="Hitting_prents">
                                        <div class="side-bet">
                                            <p class="bet-name">${option.betName}</p>
                                            <p class="bet-ratio">1:${Number(option.ratio) - 1}</p>
                                        </div>
                                        <button class="button_payout" style="visibility: hidden"> <span class="text-white-pay">Payout:</span><span class="text-yellow"><span id="payout">0</span></span></button>
                                    </div>
                                    <i class="bi bi-question-circle icon-question"
                                        data-bs-toggle="modal" data-bs-target="#modal-note"><span id="sidebet-note" style="display: none;">${option.note}</span></i>
                                </div>
                                <div class="main_right">
                                    <div class="">
                                        <button id="${option.betName}-${this.mainUI.tableInfo.bigBlind * 10}" class="p-bule btun"><span class="btau_text">${(getMoneyText(this.mainUI.tableInfo.bigBlind * 10)).outerHTML}</span></button>
                                    </div>
                                    <div class="">
                                        <button id="${option.betName}-${this.mainUI.tableInfo.bigBlind * 20}" class="p-bule btun"><span class="btau_text">${(getMoneyText(this.mainUI.tableInfo.bigBlind * 20)).outerHTML}</span></button>
                                    </div>
                                    <div class="">
                                        <button id="${option.betName}-${this.mainUI.tableInfo.bigBlind * 50}" class="p-bule btun"><span class="btau_text">${(getMoneyText(this.mainUI.tableInfo.bigBlind * 50)).outerHTML}</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        }
        $(".scroll_prents").append(div);

        const questionIcons = $('.icon-question');
        for (const icon of questionIcons) {
            icon.addEventListener('click', (e) => {
                $('.sidebet-note')[0].innerText = $(e.currentTarget).find("#sidebet-note")[0].innerText;
            });
        }

        const elements = $('.btun');
        for (const button of elements) {
            button.addEventListener('click', (e) => {
                const parentNode = e.currentTarget.parentNode.parentNode.parentNode;
                const ratio = Number($(parentNode).find(".bet-ratio")[0].innerText.split(':')[1]);
                const totalAmountNode = $('#submit-sidebet').find('#total-amount')[0];

                if (e.currentTarget.classList.contains('selected')) {
                    e.currentTarget.classList.remove("selected");
                    $(parentNode).find("#payout")[0].innerText = 0;
                    $(parentNode).find(".button_payout")[0].style.visibility = 'hidden';
                } else {
                    const currentBetAmount = Number(e.currentTarget.id.split('-')[1]);
                    const totalBetedAmount = Number(totalAmountNode.innerText.split('$')[0]);

                    if (currentBetAmount + totalBetedAmount > this.freeBalance) {
                        return;
                    }

                    e.currentTarget.classList.add("selected");
                    $(parentNode).find("#payout")[0].innerHTML = (getMoneyText(currentBetAmount * ratio)).outerHTML;
                    $(parentNode).find(".button_payout")[0].style.visibility = 'visible';
                }

                let totalBet = 0;
                for (const otherButton of elements) {
                    if (otherButton.id !== e.currentTarget.id && (otherButton.id.split('-')[0] === e.currentTarget.id.split('-')[0])) {
                        otherButton.classList.remove("selected");
                    }

                    if (otherButton.classList.contains('selected')) {
                        totalBet = totalBet + Number(otherButton.id.split('-')[1]);
                    }
                }

                let totalPayout = 0;
                for (const payout of $(".text-yellow")) {
                    totalPayout = totalPayout + Number($(payout).find("#payout")[0].innerText);
                }

                const totalBetText = getMoneyText(totalBet);
                const totalPayoutText = getMoneyText(totalPayout);
                        totalAmountNode.innerHTML = totalBetText.outerHTML;
                        $('#total-payout')[0].innerHTML = totalPayoutText.outerHTML;
            });
        }
    }

    updateFreeBalance(balance) {
        const balanceText = getMoneyText(balance);
        $('#free-balance')[0].innerHTML = balanceText.outerHTML;
        this.freeBalance = Number(balance);
    }

    updateSideBetHistory(res) {
        if (Number(res.totalReward) > 0) {
            const totalRewardText = getMoneyText(res.totalReward);
            $('.top_200')[0].innerHTML = totalRewardText.outerHTML;
            setTimeout(() => {
                $('#modal-wining-payout').modal('show');
            }, 3000);

            setTimeout(() => {
                $('#modal-wining-payout').modal('hide');
            }, 5000);
        }

        console.log('Winning History', res.historyLists);
        let total = 0;
        let div = '';
        for (const list of res.historyLists) {
            total = total + list.award;
            let day = new Date(list.timestamp).getDay();
            const hour = new Date(list.timestamp).getHours();
            const min = new Date(list.timestamp).getMinutes();
            div = div + `<div class="fund_prents mb-1 mt-1">
                            <div class="funds3 ">
                                <div class="top_prents">
                                    <div class="main_hittings">
                                        <div class="top px-1"><img src="images/dollar coinn.png">
                                            <div class="allmix">
                                                <p class="pair">${list.betName}
                                                <p class="today">Today | ${hour}:${min}</p>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="div_in_text">
                                            <p class="amount">$${list.award}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        }

        $(".scroll_prentss").find('.fund_prents').remove();
        $(".scroll_prentss").append(div);
        const totalText = getMoneyText(total);
        $(".sidebet-total-win")[0].innerHTML = totalText.outerHTML;
    }

    showGame01Result(data) {
        const tableCards = data.tableCards;
        for (let i = 0; i < tableCards.length; ++i) {
            const cardFilePath = getCardImageFilePath(tableCards[i]);

            const tableCard = `<div class="card1" value=${tableCards[i].toLowerCase()}>
                                <img src="${cardFilePath}"/>
                               </div>`;

            $('.row2').append(tableCard);
        }
        const classes = ['left_sidecard', 'right_sidecard'];
        const dealerCards = data.dealerCards;
        for (let i = 0; i < dealerCards.length; ++i) {
            const cardFilePath = getCardImageFilePath(dealerCards[i]);

            const dealerCard = `<div value=${dealerCards[i].toLowerCase()} ${classes[i] == 'right_sidecard' ? 'style="z-index: 1;"' : 0}>
                                    <img src="${cardFilePath}" class="${classes[i]}" />
                                </div>`;

            $('#dealer_cards').append(dealerCard);
        }

        const playerCards = data.playerCards;
        for (let i = 0; i < playerCards.length; ++i) {
            const cardFilePath = getCardImageFilePath(playerCards[i]);

            const playerCard = `<div value=${playerCards[i].toLowerCase()} ${classes[i] == 'right_sidecard' ? 'style="z-index: 1;"' : 0}>
                                    <img src="${cardFilePath}" class="${classes[i]}" />
                                </div>`;

            $('#player_cards').append(playerCard);
        }

        setTimeout(() => {
            highlightGame01TableCards(data.winnersHand[0].cards);
            highlightGame01PlayerCards($('#dealer_cards div'), data.winnersHand[0].cards);
            highlightGame01PlayerCards($('#player_cards div'), data.winnersHand[0].cards);
        }, 1000);

        setTimeout(() => {
            highlightGame01TableCards();
            highlightGame01PlayerCards($('#dealer_cards div'));
            highlightGame01PlayerCards($('#player_cards div'));
        }, 2000);
        
        if (data.winningRatioBB > 0) {
            $('.top_200')[0].innerHTML = `${data.winningRatioBB}BB`;
            setTimeout(() => {
                $('#modal-wining-payout').modal('show');
            }, 2000);

            setTimeout(() => {
                $('#modal-wining-payout').modal('hide');
            }, 4000);
        }

        setTimeout(() => {
            $('.row2 .card1').remove();
            $('#dealer_cards div').remove();
            $('#player_cards div').remove();
        }, 4000);
    }

    showGame01Panel(value) {
        this.isGame01Visible = value;
        const game01Div = $('.gane_div_prents')[0];
        if (!value) {
            game01Div.style.display = 'none';
            $('.text_div')[0].classList.remove('d-none');
            streetLabel.innerText = "Street";
        }
        else {
            game01Div.style.display = '';
            $('.text_div')[0].classList.add('d-none');
            this.currentGameMode = gameModes.Game02;
            this.toggleSidebetGame();
        }
    }

    showGame02Result(data) {
        const tableCards = data.tableCards;
        for (let i = 0; i < tableCards.length; ++i) {
            const cardFilePath = getCardImageFilePath(tableCards[i]);

            const tableCard = `<div class="card1" value=${tableCards[i].toLowerCase()}>
                                <img src="${cardFilePath}"/>
                               </div>`;

            $('.row2').append(tableCard);
        }
        const classes = ['left_sidecard', 'right_sidecard'];

        const playerCards = data.playerCards;
        for (let i = 0; i < playerCards.length; ++i) {
            const cardFilePath = getCardImageFilePath(playerCards[i]);

            const playerCard = `<div value=${playerCards[i].toLowerCase()} ${classes[i] == 'right_sidecard' ? 'style="z-index: 1;"' : 0}>
                                    <img src="${cardFilePath}" class="${classes[i]}" />
                                </div>`;

            $('#player_cards').append(playerCard);
        }

        setTimeout(() => {
            highlightGame01TableCards(data.winnersHand[0].cards);
            highlightGame01PlayerCards($('#player_cards div'), data.winnersHand[0].cards);
        }, 1000);

        setTimeout(() => {
            highlightGame01TableCards();
            highlightGame01PlayerCards($('#player_cards div'));
        }, 2000);
        
        if (data.winningRatioBB > 0) {
            $('.top_200')[0].innerHTML = `${data.winningRatioBB}BB`;
            setTimeout(() => {
                $('#modal-wining-payout').modal('show');
            }, 2000);

            setTimeout(() => {
                $('#modal-wining-payout').modal('hide');
            }, 4000);
        }

        setTimeout(() => {
            $('.row2 .card1').remove();
            $('#player_cards div').remove();
        }, 4000);
    }

    showPanel(value) {
        sidebetPanel.style.visibility = value ? "visible" : "hidden";
    }
}

function highlightGame01TableCards(cards) {
    const tableCards = $(".row2 .card1");

    if (!cards) {
        for (const card of tableCards) {
            if (card.attributes['value'].value != "?")
                card.classList.remove("with_mask")
        };
        return;
    }

    for (const card of tableCards) {
        if (cards.indexOf(card.attributes['value'].value.toUpperCase()) == -1) {
            card.classList.add("with_mask")
        }
    }
}

function highlightGame01PlayerCards(cards, winnerCards) {
    if (!winnerCards) {
        for (const card of cards) {
            if (card.attributes['value'].value != "?")
                card.classList.remove("with_mask")
        };
        return;
    }

    for (const card of cards) {
        if (winnerCards.indexOf(card.attributes['value'].value.toUpperCase()) == -1) {
            card.classList.add("with_mask")
        }
    }
}