import { NavLink } from "react-router-dom";

export default function Navbar(){
    const navWrapStyle = {
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "linear-gradient(90deg, #16a34a, #22c55e)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
    };

    const navInnerStyle = {
        width: "100%",
        margin: 0,
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap"
    };

    const brandStyle = {
        color: "white",
        textDecoration: "none",
        fontWeight: 800,
        letterSpacing: "0.2px"
    };

    const linksWrapStyle = {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap"
    };

    const linkStyle = ({ isActive }) => ({
        color: "white",
        textDecoration: "none",
        fontWeight: 700,
        padding: "8px 12px",
        borderRadius: "999px",
        background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
        border: isActive ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
        transition: "all 150ms ease",
        outline: "none"
    });

    return(
        <div style={navWrapStyle}>
            <div style={navInnerStyle}>
                <NavLink to="/" style={brandStyle}>
                    Smart Meal Planner
                </NavLink>

                <div style={linksWrapStyle}>
                    <NavLink to="/" style={linkStyle}>
                        Dashboard
                    </NavLink>
                    <NavLink to="/meals" style={linkStyle}>
                        Meal Schedule
                    </NavLink>
                    <NavLink to="/recipes" style={linkStyle}>
                        Recipes
                    </NavLink>
                </div>
            </div>
        </div>
    );
}