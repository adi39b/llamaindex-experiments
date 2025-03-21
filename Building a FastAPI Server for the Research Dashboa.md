<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# 

---

# Building a FastAPI Server for the Research Dashboard

I'll create a FastAPI server that integrates with the Dash application to log research records, store results in SQLite, and provide API endpoints for accessing historical data. Here's how the implementation works:

## FastAPI Server Implementation

```python
# api/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class ResearchRun(Base):
    __tablename__ = "research_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, index=True)
    researcher = Column(String)
    date = Column(DateTime, default=datetime.now)
    duration_mins = Column(Float)
    status = Column(String)
    insights = Column(Integer)
    
    details = relationship("ResearchDetail", back_populates="research_run", cascade="all, delete-orphan")
    results = relationship("ResearchResult", back_populates="research_run", cascade="all, delete-orphan")

class ResearchDetail(Base):
    __tablename__ = "research_details"
    
    id = Column(Integer, primary_key=True, index=True)
    research_run_id = Column(Integer, ForeignKey("research_runs.id"))
    step_name = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    status = Column(String)
    
    research_run = relationship("ResearchRun", back_populates="details")

class ResearchResult(Base):
    __tablename__ = "research_results"
    
    id = Column(Integer, primary_key=True, index=True)
    research_run_id = Column(Integer, ForeignKey("research_runs.id"))
    result_type = Column(String)  # "market_position", "financial_health", "swot", etc.
    result_data = Column(Text)  # JSON data
    
    research_run = relationship("ResearchRun", back_populates="results")
```

```python
# api/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Research Run schemas
class ResearchRunBase(BaseModel):
    company: str
    researcher: str
    duration_mins: float
    status: str
    insights: int

class ResearchRunCreate(ResearchRunBase):
    pass

class ResearchRunResponse(ResearchRunBase):
    id: int
    date: datetime
    
    class Config:
        orm_mode = True

# Research Detail schemas
class ResearchDetailBase(BaseModel):
    step_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str

class ResearchDetailCreate(ResearchDetailBase):
    research_run_id: int

class ResearchDetailResponse(ResearchDetailBase):
    id: int
    research_run_id: int
    
    class Config:
        orm_mode = True

# Research Result schemas
class ResearchResultBase(BaseModel):
    result_type: str
    result_data: str  # JSON string

class ResearchResultCreate(ResearchResultBase):
    research_run_id: int

class ResearchResultResponse(ResearchResultBase):
    id: int
    research_run_id: int
    
    class Config:
        orm_mode = True
```

```python
# api/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./research.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# api/main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging
from . import models, schemas
from .database import engine, get_db, SessionLocal

# Create tables
models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("api.log"), logging.StreamHandler()]
)
logger = logging.getLogger("research_api")

# Create FastAPI app
app = FastAPI(title="Research Dashboard API")

# Research Run endpoints
@app.post("/research_runs/", response_model=schemas.ResearchRunResponse)
def create_research_run(run: schemas.ResearchRunCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating research run for company: {run.company}")
    db_run = models.ResearchRun(**run.dict())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

@app.get("/research_runs/", response_model=List[schemas.ResearchRunResponse])
def get_research_runs(
    skip: int = 0, 
    limit: int = 100, 
    company: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    logger.info(f"Fetching research runs with filters: company={company}, status={status}")
    query = db.query(models.ResearchRun)
    
    if company:
        query = query.filter(models.ResearchRun.company.contains(company))
    if status:
        query = query.filter(models.ResearchRun.status == status)
        
    return query.order_by(models.ResearchRun.id.desc()).offset(skip).limit(limit).all()

@app.get("/research_runs/{run_id}", response_model=schemas.ResearchRunResponse)
def get_research_run(run_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching research run with ID: {run_id}")
    db_run = db.query(models.ResearchRun).filter(models.ResearchRun.id == run_id).first()
    if db_run is None:
        logger.warning(f"Research run not found: {run_id}")
        raise HTTPException(status_code=404, detail="Research run not found")
    return db_run

# Research Detail endpoints
@app.post("/research_details/", response_model=schemas.ResearchDetailResponse)
def create_research_detail(detail: schemas.ResearchDetailCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating research detail for run ID: {detail.research_run_id}")
    db_detail = models.ResearchDetail(**detail.dict())
    db.add(db_detail)
    db.commit()
    db.refresh(db_detail)
    return db_detail

@app.get("/research_details/{run_id}", response_model=List[schemas.ResearchDetailResponse])
def get_research_details(run_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching research details for run ID: {run_id}")
    return db.query(models.ResearchDetail).filter(models.ResearchDetail.research_run_id == run_id).all()

# Research Result endpoints
@app.post("/research_results/", response_model=schemas.ResearchResultResponse)
def create_research_result(result: schemas.ResearchResultCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating research result for run ID: {result.research_run_id}")
    db_result = models.ResearchResult(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

@app.get("/research_results/{run_id}", response_model=List[schemas.ResearchResultResponse])
def get_research_results(run_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching research results for run ID: {run_id}")
    return db.query(models.ResearchResult).filter(models.ResearchResult.research_run_id == run_id).all()
```


## Integration with Dash

### Main Application Changes

```python
# main.py
import dash
from dash import html, dcc
import dash_bootstrap_components as dbc
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware
import uvicorn
from api.main import app as api_app

# Initialize the Dash app with Bootstrap theming
dash_app = dash.Dash(__name__, 
                use_pages=True,
                external_stylesheets=[dbc.themes.SANDSTONE],
                suppress_callback_exceptions=True)

# Navbar and layout code remains the same...

# Create FastAPI app
app = FastAPI()

# Mount the Dash app
app.mount("/", WSGIMiddleware(dash_app.server))

# Include API routes
app.include_router(api_app, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```


## Modified Pages

### Researcher Page

```python
# pages/researcher.py - Modified version
import dash
from dash import dcc, html, callback, Input, Output, State
import dash_bootstrap_components as dbc
import time
import random
import requests
import json
from datetime import datetime

# Register the page
dash.register_page(__name__, path='/researcher', name='Researcher', title='Research Dashboard - Researcher')

# Layout remains the same...

# Modified callback to record research to the API
@callback(
    [Output("research-progress-container", "style"),
     Output("research-status", "children"),
     Output("research-progress", "value"),
     Output("research-details", "children"),
     Output("research-results-container", "style"),
     Output("research-results", "children"),
     Output("download-report", "style")],
    [Input("search-button", "n_clicks")],
    [State("company-input", "value")],
    prevent_initial_call=True
)
def start_research(n_clicks, company_name):
    if not company_name:
        return {"display": "none"}, "", 0, "", {"display": "none"}, "", {"display": "none"}
    
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
    
    # Start timing the research
    start_time = datetime.now()
    run_id = None
    
    # Create the research run in the API
    try:
        total_duration = sum(step["time"] for step in steps)
        research_data = {
            "company": company_name,
            "researcher": "John Doe",  # In a production app, get from user session
            "duration_mins": total_duration,
            "status": "Completed",
            "insights": random.randint(5, 15)
        }
        
        response = requests.post("http://localhost:8000/api/research_runs/", json=research_data)
        if response.status_code == 200:
            run_id = response.json()["id"]
            
            # Log each research step
            for step in steps:
                step_start = datetime.now()
                # Simulate processing time
                time.sleep(step["time"])
                step_end = datetime.now()
                
                step_data = {
                    "research_run_id": run_id,
                    "step_name": step["name"],
                    "start_time": step_start.isoformat(),
                    "end_time": step_end.isoformat(),
                    "status": "Completed"
                }
                
                requests.post("http://localhost:8000/api/research_details/", json=step_data)
    except Exception as e:
        print(f"Error logging to API: {str(e)}")
    
    # Generate research results with random values
    market_share = random.randint(5, 25)
    revenue_growth = random.randint(-5, 25)
    profit_margin = random.randint(5, 30)
    debt_equity = random.uniform(0.1, 2.0)
    
    # Store research results in the API
    if run_id:
        try:
            # Market position data
            market_data = {
                "research_run_id": run_id,
                "result_type": "market_position",
                "result_data": json.dumps({
                    "market_share": market_share,
                    "competitors": ['Competitor ' + str(i) for i in range(1, 4)]
                })
            }
            
            # Financial data
            financial_data = {
                "research_run_id": run_id,
                "result_type": "financial_health",
                "result_data": json.dumps({
                    "revenue_growth": revenue_growth,
                    "profit_margin": profit_margin,
                    "debt_equity_ratio": debt_equity
                })
            }
            
            # SWOT analysis
            swot_data = {
                "research_run_id": run_id,
                "result_type": "swot_analysis",
                "result_data": json.dumps({
                    "strengths": ["Strong brand recognition", "Diversified portfolio", "Efficient supply chain"],
                    "weaknesses": ["High operational costs", "Limited international presence", "Aging infrastructure"],
                    "opportunities": ["Emerging market expansion", "Digital transformation", "Strategic acquisitions"],
                    "threats": ["Increasing competition", "Regulatory changes", "Economic uncertainty"]
                })
            }
            
            requests.post("http://localhost:8000/api/research_results/", json=market_data)
            requests.post("http://localhost:8000/api/research_results/", json=financial_data)
            requests.post("http://localhost:8000/api/research_results/", json=swot_data)
        except Exception as e:
            print(f"Error storing results: {str(e)}")
    
    # Final progress state
    current_progress = 100
    final_status = f"Research Complete: {company_name}"
    final_details = html.P("All research steps completed successfully!", className="text-success")
    
    # Build results UI (same as before)
    results_style = {"display": "block"}
    results_content = html.Div([
        html.H4(f"Summary Report: {company_name}"),
        html.Hr(),
        # Results content remains the same...
    ])
    
    download_style = {"display": "block"}
    
    return (progress_style, final_status, current_progress, final_details, 
            results_style, results_content, download_style)
```


### Historical Records Page

```python
# pages/historical_records.py - Modified to use the API
import dash
from dash import dcc, html, callback, Input, Output, dash_table, State
import dash_bootstrap_components as dbc
import pandas as pd
import requests
import json
from datetime import datetime

# Register the page
dash.register_page(__name__, path='/historical-records', name='Historical Records', title='Research Dashboard - Historical Records')

# Function to fetch historical data from API
def fetch_historical_data():
    try:
        response = requests.get("http://localhost:8000/api/research_runs/")
        if response.status_code == 200:
            data = response.json()
            df = pd.DataFrame(data)
            df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d %H:%M")
            df = df.sort_values("id", ascending=False)
            return df
        else:
            print(f"Failed to fetch data: {response.text}")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error fetching historical data: {str(e)}")
        return pd.DataFrame()

# Add a button to refresh data and a modal for details
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
                            dbc.Button("Refresh Data", id="refresh-data", color="primary", className="me-2"),
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
                        data=fetch_historical_data().to_dict("records"),
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
                        row_selectable="single",
                    ),
                    html.Div(id="table-info", className="mt-3 text-muted small"),
                ])
            ], className="shadow")
        ], width=12)
    ]),
    
    # Modal for displaying research details
    dbc.Modal(
        [
            dbc.ModalHeader(dbc.ModalTitle("Research Run Details")),
            dbc.ModalBody(id="research-details-modal-body"),
            dbc.ModalFooter(
                dbc.Button("Close", id="close-modal", className="ms-auto")
            ),
        ],
        id="research-details-modal",
        size="lg",
        is_open=False,
    ),
], fluid=True)

# Callback to filter and refresh the data table
@callback(
    [Output("historical-table", "data"),
     Output("table-info", "children")],
    [Input("company-filter", "value"),
     Input("status-filter", "value"),
     Input("date-filter", "start_date"),
     Input("date-filter", "end_date"),
     Input("clear-filters", "n_clicks"),
     Input("refresh-data", "n_clicks")]
)
def filter_table(company, status, start_date, end_date, clear_clicks, refresh_clicks):
    # Always fetch fresh data from API
    df = fetch_historical_data()
    
    # Check if clear button was clicked
    ctx = dash.callback_context
    if ctx.triggered and 'clear-filters' in ctx.triggered[^1_0]['prop_id']:
        filtered_df = df
    else:
        # Apply filters
        if company:
            df = df[df['company'].str.contains(company, case=False)]
        
        if status != "all":
            df = df[df['status'] == status]
        
        if start_date:
            df = df[pd.to_datetime(df['date']) >= pd.to_datetime(start_date)]
        
        if end_date:
            df = df[pd.to_datetime(df['date']) <= pd.to_datetime(end_date)]
        
        filtered_df = df
    
    info_text = f"Showing {len(filtered_df)} of {len(fetch_historical_data())} total records"
    
    return filtered_df.to_dict("records"), info_text

# Callback to show research details modal
@callback(
    [Output("research-details-modal", "is_open"),
     Output("research-details-modal-body", "children")],
    [Input("historical-table", "selected_rows"),
     Input("close-modal", "n_clicks")],
    [State("historical-table", "data"),
     State("research-details-modal", "is_open")]
)
def toggle_modal(selected_rows, close_clicks, data, is_open):
    ctx = dash.callback_context
    trigger = ctx.triggered[^1_0]["prop_id"].split(".")[^1_0]
    
    if trigger == "close-modal":
        return False, None
    
    if selected_rows:
        run_id = data[selected_rows[^1_0]]["id"]
        
        try:
            # Fetch run details
            details_response = requests.get(f"http://localhost:8000/api/research_details/{run_id}")
            details = details_response.json() if details_response.status_code == 200 else []
            
            # Fetch results
            results_response = requests.get(f"http://localhost:8000/api/research_results/{run_id}")
            results = results_response.json() if results_response.status_code == 200 else []
            
            # Create content for the modal
            content = html.Div([
                html.H4(f"Research Run #{run_id}: {data[selected_rows[^1_0]]['company']}"),
                html.Hr(),
                
                # Research steps timeline
                html.H5("Research Steps", className="mt-4"),
                dbc.Table([
                    html.Thead([
                        html.Tr([
                            html.Th("Step"), 
                            html.Th("Start Time"), 
                            html.Th("End Time"), 
                            html.Th("Status")
                        ])
                    ]),
                    html.Tbody([
                        html.Tr([
                            html.Td(detail["step_name"]),
                            html.Td(detail["start_time"]),
                            html.Td(detail["end_time"] or "N/A"),
                            html.Td(html.Span(detail["status"], 
                                   className="badge bg-success" if detail["status"] == "Completed" else "badge bg-warning"))
                        ]) for detail in details
                    ])
                ], bordered=True, hover=True, striped=True),
                
                # Parse and display research results
                html.H5("Research Results", className="mt-4"),
                html.Div([
                    html.Div([
                        html.H6(result["result_type"].replace("_", " ").title()),
                        html.Pre(json.dumps(json.loads(result["result_data"]), indent=2), 
                                style={"backgroundColor": "#f8f9fa", "padding": "10px", "borderRadius": "5px"})
                    ]) for result in results
                ])
            ])
            
            return True, content
            
        except Exception as e:
            return True, html.Div(f"Error fetching details: {str(e)}")
            
    return is_open, None
```


## Explanation of the Implementation

### 1. Database Schema

The implementation uses three main tables:

- **ResearchRun**: Stores main information about each research operation
- **ResearchDetail**: Captures step-by-step details of the research process
- **ResearchResult**: Stores structured results data as JSON strings


### 2. API Endpoints

The FastAPI application provides several endpoints:

- `/api/research_runs/`: Create and retrieve research runs
- `/api/research_details/{run_id}`: Get details for a specific research run
- `/api/research_results/{run_id}`: Get results for a specific research run


### 3. FastAPI-Dash Integration

The integration works by:

1. Creating a FastAPI application that includes both the API routes and the mounted Dash application
2. Using SQLite with the `check_same_thread=False` parameter to allow concurrent access
3. Using the WSGI middleware to mount the Dash app at the root path

### 4. Data Flow

When a user initiates research:

1. The researcher page logs a new research run in the database
2. Each research step is recorded with timestamps
3. Final results are stored as structured JSON data
4. The historical records page fetches data directly from the API

### 5. Key Features

- **Real-time Logging**: Each step of the research process is logged with timestamps
- **Structured Data Storage**: Results are stored as JSON for flexibility
- **Filtering and Searching**: Historical records can be filtered by company, status, and date
- **Detailed View**: Users can click on a record to see detailed steps and results

This implementation provides a robust backend for the research dashboard while maintaining a clean separation between the API and UI layers.

<div style="text-align: center">⁂</div>

[^1_1]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/1bf656b6-0765-45e3-92e6-abd0df7a1e3f/paste.txt

[^1_2]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/c1e7dc9b-2865-4af1-b6dd-ee296956e7fc/paste-2.txt

[^1_3]: https://www.restack.io/p/fastapi-answer-mount-dash-app

[^1_4]: https://community.plotly.com/t/create-an-api-using-dash/61600

[^1_5]: https://apidog.com/blog/logging-endpoints-python-fastapi/

[^1_6]: https://timberry.dev/adding-an-sqlite-backend-to-fastapi

[^1_7]: https://apidog.com/blog/how-to-quickly-implement-crud-operations-with-fastapi/

[^1_8]: https://community.plotly.com/t/best-method-for-triggering-a-backend-update-data-refresh/38585

[^1_9]: https://stackoverflow.com/questions/61359017/is-there-a-user-controlled-way-to-refresh-data-in-a-dash-app

[^1_10]: https://community.dataiku.com/discussion/38604/update-dataset-with-dash

[^1_11]: https://fastapi.tiangolo.com/tutorial/sql-databases/

[^1_12]: https://community.plotly.com/t/update-dash-layout-using-rest-api/17555

[^1_13]: https://www.youtube.com/watch?v=1RLFSOwpf88

[^1_14]: https://www.cdata.com/kb/tech/rest-python-dash.rst

[^1_15]: https://prefab.cloud/blog/dynamic-logging-in-fastapi-with-python/

[^1_16]: https://realpython.com/python-dash/

[^1_17]: https://www.linkedin.com/pulse/centralized-logging-fastapi-elasticsearch-kibana-parasuraman-xmn9c

[^1_18]: https://stackoverflow.com/questions/57381166/how-can-i-make-api-calls-via-browser-from-dash-plotly-application

[^1_19]: https://www.youtube.com/watch?v=Z0jbO8WT0Jc

[^1_20]: https://github.com/wpcodevo/fastapi_sqlalchemy

[^1_21]: https://dev.to/tomas223/logging-tracing-in-python-fastapi-with-opencensus-a-azure-2jcm

[^1_22]: https://stackoverflow.com/questions/65270624/how-to-connect-to-a-sqlite3-db-file-and-fetch-contents-in-fastapi

[^1_23]: https://github.com/foss42/apidash

[^1_24]: https://community.plotly.com/t/refresh-dataframe-on-page-load/55139

[^1_25]: https://docs.posit.co/connect/user/dash/

[^1_26]: https://community.plotly.com/t/update-plot-in-dash-from-rest-api/10612

---

# Provide instructions for running both the dash application and FastAPI flow in docker containers and call a database service

Here's a step-by-step guide to running both the Dash application and the FastAPI server in Docker containers, along with a SQLite database service.

## Step 1: Create Dockerfiles

First, you need to create Dockerfiles for both your Dash application and the FastAPI server.

### Dockerfile for Dash Application

Create a file named `Dockerfile-dash` in the root of your Dash project:

```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV NAME World

# Run app.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

However, since you're using Dash, you should adjust the `CMD` command to run your Dash app instead:

```dockerfile
CMD ["python", "app.py"]
```


### Dockerfile for FastAPI Server

Create a file named `Dockerfile-fastapi` in the root of your FastAPI project:

```dockerfile
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Make port 8001 available to the world outside this container
EXPOSE 8001

# Run main.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```


## Step 2: Create a Docker Compose File

To manage multiple containers and services, you can use Docker Compose. Create a file named `docker-compose.yml` in the root directory of your project:

```yaml
version: '3.8'

services:
  dash-app:
    build:
      context: .
      dockerfile: Dockerfile-dash
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=sqlite:///db/research.db

  fastapi-server:
    build:
      context: .
      dockerfile: Dockerfile-fastapi
    ports:
      - "8001:8001"
    depends_on:
      - db
    environment:
      - DATABASE_URL=sqlite:///db/research.db

  db:
    image: busybox
    volumes:
      - ./db:/db
```

However, since SQLite doesn't run as a service like a traditional database server, you should adjust the `docker-compose.yml` to simply mount a volume for the database file:

```yaml
version: '3.8'

services:
  dash-app:
    build:
      context: .
      dockerfile: Dockerfile-dash
    ports:
      - "8000:8000"
    volumes:
      - ./db:/app/db
    environment:
      - DATABASE_URL=sqlite:///db/research.db

  fastapi-server:
    build:
      context: .
      dockerfile: Dockerfile-fastapi
    ports:
      - "8001:8001"
    volumes:
      - ./db:/app/db
    environment:
      - DATABASE_URL=sqlite:///db/research.db
```


## Step 3: Build and Run Docker Containers

1. **Build the Docker images** for both services:

```bash
docker-compose build
```

2. **Run the Docker containers**:

```bash
docker-compose up
```

This command will start both the Dash application and the FastAPI server, along with mounting the SQLite database file.

## Step 4: Access Your Applications

- **Dash Application**: You can access your Dash app at `http://localhost:8000/`.
- **FastAPI Server**: You can access your FastAPI server at `http://localhost:8001/`.


## Additional Notes

- Ensure that your `requirements.txt` files are correctly configured for both projects.
- If you're using a different port for your Dash app or FastAPI server in your code, adjust the `ports` section in `docker-compose.yml` accordingly.
- The SQLite database file will be stored in a `db` directory in your project root. Make sure this directory exists or create it before running the containers.

<div style="text-align: center">⁂</div>

[^2_1]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/1bf656b6-0765-45e3-92e6-abd0df7a1e3f/paste.txt

[^2_2]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/c1e7dc9b-2865-4af1-b6dd-ee296956e7fc/paste-2.txt

---

# How does data in the json get saved within sqlite?

When you store JSON data in SQLite, it is typically stored as a string in a TEXT column. SQLite does not have a native JSON data type like some other databases (e.g., PostgreSQL or MySQL), but it does support functions for working with JSON data, such as `json()` and `json_array()`, which were introduced in SQLite version 3.9.0.

Here's how you might store JSON data in SQLite using Python's `sqlite3` module or an ORM like SQLAlchemy:

### Using sqlite3

```python
import sqlite3
import json

# Sample JSON data
data = {
    "market_share": 25,
    "competitors": ["Competitor 1", "Competitor 2"]
}

# Convert JSON to string
json_string = json.dumps(data)

# Connect to SQLite database
conn = sqlite3.connect('research.db')
cursor = conn.cursor()

# Create table if it doesn't exist
cursor.execute('''
    CREATE TABLE IF NOT EXISTS research_results (
        id INTEGER PRIMARY KEY,
        result_type TEXT,
        result_data TEXT
    )
''')

# Insert JSON data into the table
cursor.execute('INSERT INTO research_results (result_type, result_data) VALUES (?, ?)', ('market_position', json_string))

# Commit changes and close connection
conn.commit()
conn.close()
```


### Using SQLAlchemy

In your FastAPI application, you're using SQLAlchemy to interact with the database. Here's how you might define a model to store JSON data:

```python
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ResearchResult(Base):
    __tablename__ = "research_results"
    
    id = Column(Integer, primary_key=True, index=True)
    result_type = Column(String)
    result_data = Column(Text)  # Store JSON as a string
    
    def __init__(self, result_type, result_data):
        self.result_type = result_type
        self.result_data = json.dumps(result_data)
```

Then, when you create a new `ResearchResult`, you pass the JSON data as a Python dictionary, which gets converted to a string:

```python
result_data = {
    "market_share": 25,
    "competitors": ["Competitor 1", "Competitor 2"]
}

new_result = ResearchResult("market_position", result_data)
db.add(new_result)
db.commit()
```

When you retrieve the data, you can convert it back to a Python dictionary using `json.loads()`:

```python
result = db.query(ResearchResult).first()
data = json.loads(result.result_data)
print(data)  # Prints: {'market_share': 25, 'competitors': ['Competitor 1', 'Competitor 2']}
```

This approach allows you to store structured data in a flexible format within SQLite, even though SQLite doesn't natively support JSON types.

<div style="text-align: center">⁂</div>

[^3_1]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/1bf656b6-0765-45e3-92e6-abd0df7a1e3f/paste.txt

[^3_2]: https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/55981580/c1e7dc9b-2865-4af1-b6dd-ee296956e7fc/paste-2.txt

