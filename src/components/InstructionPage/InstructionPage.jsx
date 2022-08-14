import React from 'react';
import {InfoLinks} from 'components/shared';
import './styles/InstructionPage.scss';

import screen1 from './images/001.jpg';
import screen11 from './images/0011.jpg';
import screen2 from './images/002.png';
import screen3 from './images/003.png';


export default function InstructionPage() {
    console.log(screen1);

    return (<div id="instruction">
        <h2>Вывод токенов с memeus.ru. Краткая инструкция</h2>

        <p>
            В вашем кабинете в разделе "Платежи" отображается общий баланс токенов. 
            Для их вывода нажмите кнопку “Вывести токены”, предварительно создав кошелек на сайте  
            <span> </span><a href="https://wavesplatform.com" target="_blank">wavesplatform.com</a>
        </p>
        <p className="instruction_screen_container">
            <img src={screen1}/>
        </p>
        <p>
            В поле ввода введите ваш номер кошелька
        </p>
        <p className="instruction_screen_container">
            <img src={screen11}/>
        </p>
        <p>
            Платеж на ваш кошелек совершится автоматически. 
            Ваш баланс на сайте обнулится, а на ваш кошелек поступят токены MEMS. 
            Вы увидите ваши токены MEMS в разделе “портфель” на сайте 
            <span> </span><a href="https://wavesplatform.com" target="_blank">wavesplatform.com</a>
        </p>
        <p className="instruction_screen_container">
            <img src={screen2}/>
        </p>
        <p>
            Если вы захотите их продать, вы сможете сделать это в любое удобное вам время в разделе “Биржа” на сайте  
            <span> </span><a href="https://wavesplatform.com" target="_blank">wavesplatform.com</a>
        </p>
        <p className="instruction_screen_container">
            <img src={screen3}/>
        </p>
        <p>
            Не рекомендуем продавать имеющиеся у вас токены сразу после  вывода на биржу. 
            Почему? Потому что стоимость на бирже сейчас техническая, и будет повышаться ежедневно, 
            пока мы не распределим всю выручку. Плюс к этому, количество токенов изначально ограничено, 
            а начисления новых токенов сокращаются, увеличивая стоимость предыдущих начисленных токенов. 
            При том, что их стоимость привязана  к фиатной выручке сервиса, рост курса это естественная история. 
        </p>

        <InfoLinks />
    </div>)
}