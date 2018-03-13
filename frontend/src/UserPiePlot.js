import React from "react";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Sector,
    Cell,
    Label,
} from 'recharts';

export default class UserPiePlot extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            usagePieActiveIndex: null,
            usagePieSelectedIndex: null,
            activeSectorSize: 'small',
        }
    }

    updateActive(index) {
        this.setState({usagePieActiveIndex: index})
        this.setState({activeSectorSize: 'big'})
    }

    restoreSelected() {
        this.setState({usagePieActiveIndex: this.state.usagePieSelectedIndex})
        this.setState({activeSectorSize: 'small'})
    }

    updateUsername(index,name) {
        this.props.updateUsername(name);
        this.setState({usagePieSelectedIndex: index})
    }

    render() {
        let userStrings = [];
        for (let user of this.props.usageData.running) {
            userStrings.push(
                <UserString
                    key={user.username}
                    user={user}
                    hoveredIndex={this.state.usagePieActiveIndex}
                    mouseEnter={() => this.updateActive(user.index)}
                    mouseLeave={() => this.restoreSelected()}
                    onClick={() => this.updateUsername(user.index, user.username)}
                    warning={this.props.warnedUsers.includes(user.username)}
                />
            )
        }

        let queueStrings = [];
        for (let user of this.props.usageData.queued) {
            queueStrings.push(
                <QueueString
                    key={user.username}
                    user={user}
                />
            )
        }

        userStrings.sort((a, b) => (a.props.username < b.props.username ) ? -1 : (a.props.username  > b.props.username) ? 1 : 0);

        let userStringsLeft = [];
        let userStringsRight = [];
        for (let i = 0; i < userStrings.length; i++) {
            if (i < userStrings.length / 2) {
                userStringsLeft.push(userStrings[i])
            } else {
                userStringsRight.push(userStrings[i])
            }
        }

        return (
            <div className='main-item left'>
                <div className='instruction'>
                    Select a user to view detailed system usage.
                </div>
                <UsagePie
                    runningData={this.props.usageData.running}
                    runningCores={this.props.runningCores}
                    availCores={this.props.availCores}
                    onPieClick={(data,index) => this.updateUsername(index,data.name)}
                    onMouseEnter={(data,index) => this.updateActive(index)}
                    onMouseLeave={(data,index) => this.restoreSelected()}
                    activeIndex={this.state.usagePieActiveIndex}
                    activeSectorSize={this.state.activeSectorSize}
                />
                <div className='bad-job'>
                    Users and nodes with bad jobs are highlighted.
                </div>
                <div className="heading">
                    Running:
                </div>
                <div className="user-strings">
                    <div className="user-strings-col">
                        {userStringsLeft}
                    </div>
                    <div className="user-strings-col">
                        {userStringsRight}
                    </div>
                </div>
                <div className="heading">
                    Queue: {this.props.queue.size} jobs for {this.props.queue.cpuHours} cpu-h ({(this.props.queue.cpuHours / this.props.availCores).toFixed(0)} machine-h)
                </div>
                <div className="queue-strings">
                    {queueStrings}
                </div>
            </div>
        )
    }
}


class UserString extends React.Component {
    render() {
        let nameClass= 'user-string';
        if (this.props.user.index === this.props.hoveredIndex) {
            nameClass += ' hovered'
        }
        if (this.props.warning) {
            nameClass += ' warn'
        }
        return (
            <div
                className={nameClass}
                onMouseEnter={this.props.mouseEnter}
                onMouseLeave={this.props.mouseLeave}
                onClick={this.props.onClick}
            >
                <div className="user-string-username">
                    {this.props.user.username}
                </div>
                <div className="user-string-percent">
                    {this.props.user.percent}%
                </div>
                <div className="user-string-jobs">
                    ({this.props.user.jobs} jobs)
                </div>
            </div>
        )
    }

}


class UsagePie extends React.Component {
    renderActiveShape(props) {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle,
            fill } = props;

        let growth = 0.0;
        if (this.props.activeSectorSize === 'small') {
            growth = 0.02
        } else {
            growth = 0.04
        }

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius*(1.0 - growth)}
                    outerRadius={outerRadius*(1.0 + growth)}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
            </g>
        )
    }

    pieMouseEnter(data, index) {
        this.props.onMouseEnter(data, index);
    }

    pieMouseLeave(data, index) {
        this.props.onMouseLeave();
    }

    render() {
        const style = getComputedStyle(document.documentElement);
        const pieColors = [
            style.getPropertyValue('--piecycle-1'),
            style.getPropertyValue('--piecycle-2'),
            style.getPropertyValue('--piecycle-3'),
            style.getPropertyValue('--piecycle-4'),
        ];

        function PieLabel({viewBox, value1, value2, value3}) {
            const {cx, cy} = viewBox;
            return (
                <text x={cx} y={cy} fill="#3d405c" className="recharts-text recharts-label" textAnchor="middle" dominantBaseline="central">
                    <tspan alignmentBaseline="middle" x={cx} fontSize="48">{value1}</tspan>
                    <tspan alignmentBaseline="middle" x={cx} dy="1.5em" fontSize="18">{value2}</tspan>
                    <tspan alignmentBaseline="middle" x={cx} dy="1.0em" fontSize="22">{value3}</tspan>
                </text>
            )
        }

        let pieData = [];
        for (let user of this.props.runningData) {
            pieData.push({
                username: user.username,
                cpus: user.cpus,
            })
        }

        return (
            <div>
            <ResponsiveContainer width='100%' minWidth={0} minHeight={400}>
                <PieChart>
                    <Pie
                        activeIndex={this.props.activeIndex}
                        activeShape={(props) => this.renderActiveShape(props)}
                        data={pieData}
                        nameKey='username'
                        dataKey='cpus'
                        // label={({username, percent, jobs})=>`${username} ${percent}% (${jobs} jobs)`}
                        labelLine={false}
                        // cx={400}
                        // cy={400}
                        innerRadius="60%"
                        outerRadius="70%"
                        fill="#8884d8"
                        paddingAngle={2}
                        startAngle={90 + (360 * (1.0 - (this.props.runningCores / this.props.availCores)))}
                        endAngle={450}
                        onClick={(data,index) => this.props.onPieClick(data,index)}
                        onMouseEnter={(data,index) => this.pieMouseEnter(data,index)}
                        onMouseLeave={(data,index) => this.pieMouseLeave(data,index)}
                    >
                        {
                            this.props.runningData.map(
                                (entry, index) => <Cell
                                    key={index}
                                    fill={pieColors[index % pieColors.length]}
                                />
                            )
                        }
                        <Label
                            // width="50%"
                            position="center"
                            content={<PieLabel
                                value1={`${(this.props.runningCores / this.props.availCores * 100).toFixed(0)}%`}
                                value2={`(${this.props.runningCores} / ${this.props.availCores})`}
                                value3='core utilization'
                            />}>
                        </Label>
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            </div>
        )
    }
}



class QueueString extends React.Component {
    render() {
        return (
            <div
                className='queue-string'
            >
                <div className="queue-string-username">
                    {this.props.user.username}
                </div>
                <div className="queue-string-hours">
                    {this.props.user.hours.toFixed(0)} cpu-h
                </div>
                <div className="queue-string-jobs">
                    ({this.props.user.jobs} jobs)
                </div>
            </div>
        )
    }
}