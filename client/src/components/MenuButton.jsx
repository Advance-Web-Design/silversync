import React from 'react';

function MenuButton(props) {
    return (
        <button className= "menu-item"/* give tailwind class here */ onClick={props.onClick}>
            {props.label}
        </button>
    );
}

export default MenuButton;