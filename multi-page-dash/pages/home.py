# pages/home.py
import dash
from dash import dcc, html, callback, Input, Output
import dash_bootstrap_components as dbc
import plotly.express as px
import pandas as pd
import numpy as np

# Register the page
dash.register_page(__name__, path='/', name='Home', title='Research Dashboard - Home')

# Generate sample dashboard data
def generate_data():
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    research_runs = np.random.randint(5, 30, size=len(dates))
    success_rate = np.random.uniform(0.7, 0.95, size=len(dates))
    avg_duration = np.random.uniform(2, 10, size=len(dates))
    
    df = pd.DataFrame({
        'date': dates,
        'research_runs': research_runs,
        'success_rate': success_rate,
        'avg_duration': avg_duration
    })
    
    return df

# Create stats cards for dashboard
def create_stat_cards():
    df = generate_data()
    
    total_runs = df['research_runs'].sum()
    avg_success = df['success_rate'].mean() * 100
    avg_time = df['avg_duration'].mean()
    
    cards = [
        dbc.Card(
            dbc.CardBody([
                html.H4("Total Research Runs", className="card-title"),
                html.H2(f"{total_runs}", className="card-text text-primary"),
            ]),
            className="mb-4 shadow"
        ),
        dbc.Card(
            dbc.CardBody([
                html.H4("Average Success Rate", className="card-title"),
                html.H2(f"{avg_success:.1f}%", className="card-text text-success"),
            ]),
            className="mb-4 shadow"
        ),
        dbc.Card(
            dbc.CardBody([
                html.H4("Average Research Duration", className="card-title"),
                html.H2(f"{avg_time:.2f} mins", className="card-text text-info"),
            ]),
            className="mb-4 shadow"
        ),
    ]
    
    return cards

# Home page layout
layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("Research Dashboard", className="text-primary"),
            html.P("Overview of research operations and performance metrics", className="lead"),
        ]),
    ], className="mb-4"),
    
    # Statistics cards
    dbc.Row([
        dbc.Col(card, width=4) for card in create_stat_cards()
    ]),
    
    # Interactive graph
    dbc.Row([
        dbc.Col([
            html.H3("Research Activity", className="mt-4"),
            dbc.Card([
                dbc.CardBody([
                    dcc.Dropdown(
                        id='graph-metric',
                        options=[
                            {'label': 'Research Runs', 'value': 'research_runs'},
                            {'label': 'Success Rate', 'value': 'success_rate'},
                            {'label': 'Average Duration', 'value': 'avg_duration'}
                        ],
                        value='research_runs',
                        className="mb-2"
                    ),
                    dcc.Graph(id='main-graph')
                ])
            ], className="shadow")
        ], width=12)
    ], className="mb-4"),
    
    # Recent activity table
    dbc.Row([
        dbc.Col([
            html.H3("Recent Activity", className="mt-4"),
            dbc.Card([
                dbc.CardBody([
                    dbc.Table.from_dataframe(
                        generate_data().tail(5)[['date', 'research_runs', 'success_rate', 'avg_duration']].rename(
                            columns={
                                'date': 'Date', 
                                'research_runs': 'Runs', 
                                'success_rate': 'Success Rate', 
                                'avg_duration': 'Avg. Duration (mins)'
                            }
                        ),
                        striped=True, 
                        bordered=True, 
                        hover=True,
                        className="table-sm"
                    )
                ])
            ], className="shadow")
        ], width=12)
    ])
], fluid=True)

# Callback to update graph based on dropdown selection
@callback(
    Output('main-graph', 'figure'),
    Input('graph-metric', 'value')
)
def update_graph(selected_metric):
    df = generate_data()
    
    # Group by month for better visualization
    df['month'] = df['date'].dt.strftime('%Y-%m')
    monthly_data = df.groupby('month').mean().reset_index()
    
    if selected_metric == 'research_runs':
        fig = px.bar(
            monthly_data, 
            x='month', 
            y='research_runs',
            title='Monthly Research Runs',
            labels={'month': 'Month', 'research_runs': 'Number of Runs'},
            color='research_runs',
            color_continuous_scale='blues'
        )
    elif selected_metric == 'success_rate':
        fig = px.line(
            monthly_data, 
            x='month', 
            y='success_rate',
            title='Monthly Success Rate',
            labels={'month': 'Month', 'success_rate': 'Success Rate'},
            markers=True
        )
        fig.update_traces(line=dict(color='green', width=2))
    else:
        fig = px.area(
            monthly_data, 
            x='month', 
            y='avg_duration',
            title='Monthly Average Research Duration',
            labels={'month': 'Month', 'avg_duration': 'Duration (mins)'},
            color_discrete_sequence=['skyblue']
        )
    
    fig.update_layout(
        transition_duration=500,
        template='plotly_white',
        margin=dict(l=10, r=10, t=40, b=10)
    )
    
    return fig