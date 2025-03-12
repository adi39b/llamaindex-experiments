# app.py - Main application file
import dash
from dash import html, dcc
import dash_bootstrap_components as dbc

# Initialize the app with Bootstrap theming
app = dash.Dash(__name__, 
                use_pages=True,
                external_stylesheets=[dbc.themes.SANDSTONE],
                suppress_callback_exceptions=True)

# Navbar with navigation and user profile
navbar = dbc.Navbar(
    dbc.Container(
        [
            dbc.Row([
                dbc.Col(html.Img(src="/assets/logo.png", height="30px"), width="auto"),
                dbc.Col(dbc.NavbarBrand("Research Dashboard", className="ms-2"), width="auto"),
            ], align="center", className="g-0"),
            
            dbc.NavbarToggler(id="navbar-toggler", n_clicks=0),
            dbc.Collapse(
                dbc.Nav([
                    dbc.NavItem(dbc.NavLink("Home", href="/")),
                    dbc.NavItem(dbc.NavLink("Researcher", href="/researcher")),
                    dbc.NavItem(dbc.NavLink("Historical Records", href="/historical-records")),
                    # User profile dropdown in top right
                    dbc.DropdownMenu(
                        children=[
                            dbc.DropdownMenuItem("Profile", href="#"),
                            dbc.DropdownMenuItem("Settings", href="#"),
                            dbc.DropdownMenuItem(divider=True),
                            dbc.DropdownMenuItem("Logout", href="#"),
                        ],
                        nav=True,
                        in_navbar=True,
                        label="John Doe",
                        align_end=True,
                        toggle_style={"color": "white"},
                    ),
                ], className="ms-auto", navbar=True),
                id="navbar-collapse", navbar=True,
            ),
        ], fluid=True,
    ),
    color="primary",
    dark=True,
    className="mb-4",
)

# App layout with navbar and page container
app.layout = html.Div([
    navbar,
    dbc.Container([
        dash.page_container
    ], fluid=True)
])

if __name__ == '__main__':
    app.run_server(debug=True)