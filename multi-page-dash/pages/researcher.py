# pages/researcher.py

import dash
from dash import dcc, html, callback, Input, Output, State
import dash_bootstrap_components as dbc
import time
import random

# Register the page
dash.register_page(__name__, path='/researcher', name='Researcher', title='Research Dashboard - Researcher')

# Researcher page layout
layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("Company Research Tool", className="text-primary text-center mb-4"),
            html.P(
                "Enter a company name to initiate a comprehensive research workflow. "
                "Our system will gather market data, financial information, and competitive analysis.",
                className="lead text-center"
            ),
        ], width=12)
    ]),

    # Search bar and button
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            dbc.Input(
                                id="company-input",
                                type="text",
                                placeholder="Enter the company you would like to research",
                                className="mb-2"
                            ),
                        ], width=9),
                        dbc.Col([
                            dbc.Button(
                                "Search",
                                id="search-button",
                                color="primary",
                                className="w-100"
                            ),
                        ], width=3),
                    ]),
                ])
            ], className="shadow mb-4")
        ], width={"size": 8, "offset": 2})
    ]),

    # Research progress container (hidden initially)
    dbc.Row([
        dbc.Col([
            html.Div(
                id="research-progress-container",
                style={"display": "none"},
                children=[
                    dbc.Card([
                        dbc.CardHeader("Research Progress"),
                        dbc.CardBody([
                            html.Div(id="research-status", className="mb-3"),
                            dbc.Progress(id="research-progress", value=0, striped=True, animated=True, className="mb-3"),
                            html.Div(id="research-details")
                        ])
                    ], className="shadow")
                ]
            )
        ], width={"size": 10, "offset": 1})
    ]),

    # Comprehensive Report container (hidden initially)
    dbc.Row([
        dbc.Col([
            html.Div(
                id="research-results-container",
                style={"display": "none"},
                children=[
                    dbc.Card([
                        dbc.CardHeader("Comprehensive Report"),
                        dbc.CardBody([
                            html.Div(id="research-results"),
                            dbc.Button(
                                "Download Report",
                                id="download-report",
                                color="success",
                                className="mt-3",
                                style={"display": "none"}
                            ),
                        ])
                    ], className="card border-primary shadow mt-4")
                ]
            )
        ], width={"size": 10, "offset": 1})
    ]),
    
    # Evidence Section container (hidden initially)
    dbc.Row([
        dbc.Col([
            html.Div(
                id="evidence-container",
                style={"display": "none"},
                children=[
                    dbc.Card([
                        dbc.CardHeader("Evidences"),
                        dbc.CardBody([
                            html.Div(id="evidence-cards", className="mt-3"),
                        ])
                    ], className="card border-primary shadow mt-4")
                ]
            )
        ], width={"size": 10, "offset": 1})
    ])
], fluid=True)

# Callback to handle research process
@callback(
    [Output("research-progress-container", "style"),
     Output("research-status", "children"),
     Output("research-progress", "value"),
     Output("research-details", "children"),
     Output("research-results-container", "style"),
     Output("research-results", "children"),
     Output("download-report", "style"),
     Output("evidence-container", "style"),
     Output("evidence-cards", "children")],
    [Input("search-button", "n_clicks")],
    [State("company-input", "value")],
    prevent_initial_call=True
)
def start_research(n_clicks, company_name):
    if not company_name:
        return {"display": "none"}, "", 0, "", {"display": "none"}, "", {"display": "none"}, {"display": "none"}, ""

    # Show progress container
    progress_style = {"display": "block"}

    # Research steps simulation
    steps = [
        {"name": "Initializing research workflow", "time": 1},
        {"name": "Gathering market data", "time": 2},
        {"name": "Analyzing financial performance", "time": 3},
        {"name": "Conducting competitive analysis", "time": 2},
        {"name": "Generating insights", "time": 2},
    ]

    total_steps = len(steps)
    current_progress = 100  # Final progress state

    # Create final status messages
    final_status = f"Research Complete: {company_name}"
    final_details = html.P("All research steps completed successfully!", className="text-success")

    # Generate comprehensive report content
    results_content = html.Div([
        html.H4(f"Summary Report: {company_name}"),
        html.Hr(),
        dbc.Row([
            dbc.Col([
                html.H5("Market Position"),
                html.P(f"{company_name} currently holds approximately {random.randint(5, 25)}% market share in its primary industry."),
                html.P(f"Key competitors include {', '.join(['Competitor ' + str(i) for i in range(1, 4)])}.")
            ], width=6),
            dbc.Col([
                html.H5("Financial Health"),
                html.P(f"Revenue growth: {random.randint(-5, 25)}% year-over-year"),
                html.P(f"Profit margin: {random.randint(5, 30)}%"),
                html.P(f"Debt-to-equity ratio: {random.uniform(0.1, 2.0):.2f}")
            ], width=6)
        ]),
        html.H5("SWOT Analysis", className="mt-3"),
        dbc.Row([
            dbc.Col([
                html.H6("Strengths", className="text-success"),
                html.Ul([html.Li("Strong brand recognition"), html.Li("Diversified portfolio"), html.Li("Efficient supply chain")])
            ], width=6),
            dbc.Col([
                html.H6("Weaknesses", className="text-danger"),
                html.Ul([html.Li("High operational costs"), html.Li("Limited international presence"), html.Li("Aging infrastructure")])
            ], width=6)
        ]),
        dbc.Row([
            dbc.Col([
                html.H6("Opportunities", className="text-info"),
                html.Ul([html.Li("Emerging market expansion"), html.Li("Digital transformation"), html.Li("Strategic acquisitions")])
            ], width=6),
            dbc.Col([
                html.H6("Threats", className="text-warning"),
                html.Ul([html.Li("Increasing competition"), html.Li("Regulatory changes"), html.Li("Economic uncertainty")])
            ], width=6)
        ])
    ])

    # Generate evidence cards
    evidence_sources = [
        {"title": f"{company_name} Annual Report", "description": "Official annual financial report with detailed performance metrics and future outlook.", "url": "https://example.com/annual-report"},
        {"title": "Industry Analysis", "description": "Comprehensive market research and industry trends affecting the company's position.", "url": "https://example.com/industry-analysis"},
        {"title": "Competitor Benchmarking", "description": "Comparative analysis against key competitors showing relative strengths and weaknesses.", "url": "https://example.com/competitors"},
        {"title": "News and Press Releases", "description": f"Recent {company_name} announcements and media coverage affecting market perception.", "url": "https://example.com/news"},
        {"title": "Analyst Ratings", "description": "Financial analyst recommendations and consensus estimates for future performance.", "url": "https://example.com/analyst-ratings"}
    ]
    
    # Create cards for each evidence
    evidence_cards = dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(source["title"], className="fw-bold"),
                dbc.CardBody([
                    html.P(source["description"], className="card-text"),
                    dbc.Button("View Source", href=source["url"], target="_blank", color="primary")
                ])
            ], className="card bg-light shadow-sm mb-3")
        ], width=12) for source in evidence_sources
    ])

    # Show containers and button
    results_style = {"display": "block"}
    evidence_style = {"display": "block"}
    download_style = {"display": "block"}

    # Return final state
    return (progress_style, final_status, current_progress, final_details,
            results_style, results_content, download_style,
            evidence_style, evidence_cards)
