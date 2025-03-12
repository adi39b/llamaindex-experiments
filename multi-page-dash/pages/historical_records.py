# pages/historical_records.py
import dash
from dash import dcc, html, callback, Input, Output, dash_table
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Register the page
dash.register_page(__name__, path='/historical-records', name='Historical Records', title='Research Dashboard - Historical Records')

# Generate sample historical data
def generate_historical_data(n=100):
    np.random.seed(42)  # For reproducibility
    
    companies = [
        "Apple Inc.", "Microsoft Corp.", "Amazon.com Inc.", "Alphabet Inc.", "Tesla Inc.",
        "Meta Platforms Inc.", "Nvidia Corp.", "Berkshire Hathaway Inc.", "JPMorgan Chase & Co.",
        "Johnson & Johnson", "Walmart Inc.", "Visa Inc.", "Procter & Gamble Co."
    ]
    
    statuses = ["Completed", "Completed", "Completed", "Completed", "Failed", "Cancelled"]
    researchers = ["John Smith", "Emily Johnson", "Michael Brown", "Sarah Davis", "James Wilson"]
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)
    dates = [start_date + timedelta(days=int(x)) for x in np.random.randint(0, 180, size=n)]
    
    data = {
        "id": list(range(1, n+1)),
        "date": dates,
        "company": np.random.choice(companies, size=n),
        "researcher": np.random.choice(researchers, size=n),
        "duration_mins": np.random.uniform(1, 15, size=n).round(2),
        "status": np.random.choice(statuses, size=n, p=[0.7, 0.1, 0.05, 0.05, 0.05, 0.05]),
        "insights": np.random.randint(3, 15, size=n)
    }
    
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d %H:%M")
    df = df.sort_values("id", ascending=False)
    
    return df

# Historical records page layout
layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("Historical Research Records", className="text-primary"),
            html.P("Browse and filter past research runs", className="lead"),
        ]),
    ], className="mb-4"),
    
    # Filtering options
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            html.Label("Filter by Company:"),
                            dbc.Input(id="company-filter", type="text", placeholder="Enter company name"),
                        ], width=4),
                        dbc.Col([
                            html.Label("Filter by Status:"),
                            dcc.Dropdown(
                                id="status-filter",
                                options=[
                                    {"label": "All", "value": "all"},
                                    {"label": "Completed", "value": "Completed"},
                                    {"label": "Failed", "value": "Failed"},
                                    {"label": "Cancelled", "value": "Cancelled"},
                                ],
                                value="all",
                                clearable=False,
                            ),
                        ], width=4),
                        dbc.Col([
                            html.Label("Filter by Date Range:"),
                            dcc.DatePickerRange(
                                id="date-filter",
                                start_date_placeholder_text="Start Date",
                                end_date_placeholder_text="End Date",
                                calendar_orientation="horizontal",
                            ),
                        ], width=4),
                    ], className="mb-3"),
                    dbc.Row([
                        dbc.Col([
                            dbc.Button("Clear Filters", id="clear-filters", color="secondary", className="me-2"),
                            dbc.Button("Export CSV", id="export-csv", color="success"),
                        ], width=12, className="d-flex justify-content-end"),
                    ], className="mb-3"),
                ])
            ], className="shadow mb-4")
        ], width=12)
    ]),
    
    # Data table
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardBody([
                    dash_table.DataTable(
                        id="historical-table",
                        columns=[
                            {"name": "ID", "id": "id"},
                            {"name": "Date", "id": "date"},
                            {"name": "Company", "id": "company"},
                            {"name": "Researcher", "id": "researcher"},
                            {"name": "Duration (mins)", "id": "duration_mins"},
                            {"name": "Status", "id": "status"},
                            {"name": "Insights Generated", "id": "insights"},
                        ],
                        data=generate_historical_data().to_dict("records"),
                        page_size=15,
                        style_table={"overflowX": "auto"},
                        style_cell={
                            "textAlign": "left",
                            "padding": "10px",
                            "whiteSpace": "normal",
                            "height": "auto",
                        },
                        style_header={
                            "backgroundColor": "rgb(230, 230, 230)",
                            "fontWeight": "bold",
                            "border": "1px solid black",
                        },
                        style_data_conditional=[
                            {
                                "if": {"row_index": "odd"},
                                "backgroundColor": "rgb(248, 248, 248)"
                            },
                            {
                                "if": {"filter_query": "{status} = 'Completed'"},
                                "backgroundColor": "rgba(0, 184, 148, 0.2)",
                            },
                            {
                                "if": {"filter_query": "{status} = 'Failed'"},
                                "backgroundColor": "rgba(255, 118, 117, 0.2)",
                            },
                            {
                                "if": {"filter_query": "{status} = 'Cancelled'"},
                                "backgroundColor": "rgba(253, 203, 110, 0.2)",
                            },
                        ],
                        sort_action="native",
                        filter_action="native",
                        page_action="native",
                    ),
                    html.Div(id="table-info", className="mt-3 text-muted small"),
                ])
            ], className="shadow")
        ], width=12)
    ])
], fluid=True)

# Callback to filter the data table
@callback(
    [Output("historical-table", "data"),
     Output("table-info", "children")],
    [Input("company-filter", "value"),
     Input("status-filter", "value"),
     Input("date-filter", "start_date"),
     Input("date-filter", "end_date"),
     Input("clear-filters", "n_clicks")]
)
def filter_table(company, status, start_date, end_date, clear_clicks):
    # Get the full dataset
    df = generate_historical_data()
    
    # Check if clear button was clicked
    ctx = dash.callback_context
    if ctx.triggered and 'clear-filters' in ctx.triggered[0]['prop_id']:
        filtered_df = df
    else:
        # Apply company filter if provided
        if company:
            df = df[df['company'].str.contains(company, case=False)]
        
        # Apply status filter if not "all"
        if status != "all":
            df = df[df['status'] == status]
        
        # Apply date filters if provided
        if start_date:
            df = df[pd.to_datetime(df['date']) >= pd.to_datetime(start_date)]
        
        if end_date:
            df = df[pd.to_datetime(df['date']) <= pd.to_datetime(end_date)]
        
        filtered_df = df
    
    # Create info text about the filtered results
    info_text = f"Showing {len(filtered_df)} of {len(generate_historical_data())} total records"
    
    return filtered_df.to_dict("records"), info_text
