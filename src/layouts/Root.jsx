// import React from 'react';
import Footer from '../Components/Footer/Footer';
import Header from '../Components/Header/Header';
import { Outlet } from 'react-router';

const Root = () => {
    return (
        <div>
            <Header></Header>
            <Outlet></Outlet>
            <Footer></Footer>

        </div>
    );
};

export default Root;